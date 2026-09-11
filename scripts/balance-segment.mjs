import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';

const start=Number(process.env.START??0);
const count=Number(process.env.COUNT??10000);
const batchSize=1000;
const shardCount=8;
const shardSize=125;
const target=100000;

if(start<0||start%batchSize!==0)throw new Error(`START 必须是 ${batchSize} 的非负整数倍`);
if(count<=0||count%batchSize!==0)throw new Error(`COUNT 必须是 ${batchSize} 的正整数倍`);
if(start+count>target)throw new Error(`扫描范围超过 ${target}`);

function run(command,args,extraEnv={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...extraEnv}});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error(`${command} ${args.join(' ')} 退出码 ${code}`)));
  });
}

function readProgress(){
  const file='dist/balance-progress.json';
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
}

for(let offset=start;offset<start+count;offset+=batchSize){
  const checkpoint=offset+batchSize;
  const current=readProgress();
  const currentRow=current?.checkpoints?.find(row=>row.checkpoint===checkpoint);
  if(currentRow?.status==='passed'){
    console.log(`BALANCE_SEGMENT skip checkpoint=${checkpoint} already passed`);
    continue;
  }

  await run('bash',['scripts/publish-balance-progress.sh'],{CHECKPOINT:String(checkpoint),STATUS:'running'});

  const resultDir=path.join('balance-results',String(offset));
  fs.rmSync(resultDir,{recursive:true,force:true});
  fs.mkdirSync(resultDir,{recursive:true});

  await Promise.all(Array.from({length:shardCount},(_,shard)=>{
    const out=path.join(resultDir,`balance-${shard}.json`);
    return run('node',['scripts/balance-shard.mjs'],{
      OFFSET:String(offset),SHARD:String(shard),COUNT:String(shardSize),OUT:out
    });
  }));

  await Promise.all(Array.from({length:shardCount},(_,shard)=>run('node',['scripts/diagnose-balance-choice.mjs'],{
    INPUT:path.join(resultDir,`balance-${shard}.json`)
  })));

  const nextCheckpoint=checkpoint<target?checkpoint+batchSize:null;
  const env={CHECKPOINT:String(checkpoint),INPUT_DIR:resultDir};
  if(nextCheckpoint)env.NEXT_CHECKPOINT=String(nextCheckpoint);
  await run('bash',['scripts/publish-balance-progress.sh'],env);

  const updated=readProgress();
  const row=updated?.checkpoints?.find(item=>item.checkpoint===checkpoint);
  if(row?.status!=='passed')throw new Error(`checkpoint ${checkpoint} 未通过，状态=${row?.status??'missing'}`);
  fs.rmSync(resultDir,{recursive:true,force:true});
  console.log(`BALANCE_SEGMENT checkpoint=${checkpoint} completed=${updated.completedSeeds}/${updated.targetSeeds}`);
}
