const TARGET_SEEDS=100000;
const BATCH_SIZE=1000;
const statuses=new Set(['waiting','running','passed','blocked']);
const clone=value=>JSON.parse(JSON.stringify(value));
const unique=xs=>[...new Set(xs.filter(Boolean))];

function checkpointRows(){
  return Array.from({length:TARGET_SEEDS/BATCH_SIZE},(_,i)=>({
    checkpoint:(i+1)*BATCH_SIZE,
    start:i*BATCH_SIZE,
    end:(i+1)*BATCH_SIZE-1,
    status:'waiting',
    scanned:0,
    passed:0,
    failed:0,
    elapsedMs:0,
    throughput:0,
    warnings:[],
    failedSeeds:[],
    updatedAt:null
  }));
}

function recalculate(progress,now){
  const p=progress;
  p.completedSeeds=p.checkpoints.reduce((n,row)=>n+(row.status==='passed'?row.scanned:0),0);
  p.scannedSeeds=p.checkpoints.reduce((n,row)=>n+(['passed','blocked'].includes(row.status)?row.scanned:0),0);
  p.totalFailed=p.checkpoints.reduce((n,row)=>n+(row.failed??0),0);
  p.elapsedMs=p.checkpoints.reduce((n,row)=>n+(row.elapsedMs??0),0);
  p.throughput=p.elapsedMs?p.scannedSeeds/(p.elapsedMs/1000):0;
  p.progressRatio=p.targetSeeds?Math.min(1,p.completedSeeds/p.targetSeeds):0;
  p.warnings=unique(p.checkpoints.flatMap(row=>row.warnings??[]));
  p.recentFailures=p.checkpoints.flatMap(row=>row.failedSeeds??[]).sort((a,b)=>(a.index??0)-(b.index??0)).slice(-20);
  const blocked=p.checkpoints.find(row=>row.status==='blocked');
  const running=p.checkpoints.find(row=>row.status==='running');
  const waiting=p.checkpoints.find(row=>row.status==='waiting');
  p.overallStatus=blocked?'blocked':p.checkpoints.every(row=>row.status==='passed')?'completed':running?'running':p.completedSeeds?'running':'waiting';
  p.activeCheckpoint=(blocked??running??waiting)?.checkpoint??TARGET_SEEDS;
  p.updatedAt=now;
  return p;
}

export function createInitialProgress(now=new Date().toISOString()){
  return recalculate({
    version:1,
    targetSeeds:TARGET_SEEDS,
    batchSize:BATCH_SIZE,
    completedSeeds:0,
    scannedSeeds:0,
    progressRatio:0,
    overallStatus:'waiting',
    activeCheckpoint:1000,
    totalFailed:0,
    elapsedMs:0,
    throughput:0,
    updatedAt:now,
    warnings:[],
    recentFailures:[],
    checkpoints:checkpointRows()
  },now);
}

export function normalizeProgress(progress,now=new Date().toISOString()){
  if(!progress)return createInitialProgress(now);
  const existing=new Map((progress.checkpoints??[]).map(row=>[Number(row.checkpoint),row]));
  const checkpoints=checkpointRows().map(row=>existing.has(row.checkpoint)?{...row,...clone(existing.get(row.checkpoint))}:row);
  return recalculate({...clone(progress),version:1,targetSeeds:TARGET_SEEDS,batchSize:BATCH_SIZE,checkpoints},now);
}

export function applyCheckpointUpdate(progress,update,now=new Date().toISOString()){
  if(!statuses.has(update.status))throw new Error(`未知进度状态 ${update.status}`);
  const p=normalizeProgress(progress,now);
  const row=p.checkpoints.find(item=>item.checkpoint===Number(update.checkpoint));
  if(!row)throw new Error(`未知 checkpoint ${update.checkpoint}`);
  row.status=update.status;
  row.updatedAt=now;
  if(update.status==='running'){
    Object.assign(row,{scanned:0,passed:0,failed:0,elapsedMs:0,throughput:0,warnings:[],failedSeeds:[]});
  }else if(update.status==='passed'||update.status==='blocked'){
    const summary=update.summary??{};
    row.scanned=Number(summary.scanned??0);
    row.passed=Number(summary.lives??Math.max(0,row.scanned-(summary.failed??0)));
    row.failed=Number(summary.failed??update.failedSeeds?.length??0);
    row.elapsedMs=Number(summary.elapsedMs??0);
    row.throughput=Number(summary.throughput??(row.elapsedMs?row.scanned/(row.elapsedMs/1000):0));
    row.warnings=[...(summary.warnings??[])];
    row.failedSeeds=clone(update.failedSeeds??[]);
  }
  return recalculate(p,now);
}

export const balanceProgressConstants={TARGET_SEEDS,BATCH_SIZE};
