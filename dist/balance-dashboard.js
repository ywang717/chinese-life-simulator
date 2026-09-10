const $=selector=>document.querySelector(selector);
const formatInt=value=>new Intl.NumberFormat('zh-CN').format(Number(value??0));
const formatTime=iso=>iso?new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso)):'—';
const formatDuration=ms=>{
  const sec=Math.round(Number(ms??0)/1000);
  if(sec<60)return `${sec} 秒`;
  const min=Math.floor(sec/60),rest=sec%60;
  if(min<60)return `${min} 分 ${rest} 秒`;
  const hour=Math.floor(min/60),mins=min%60;
  return `${hour} 小时 ${mins} 分`;
};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusText={waiting:'等待',running:'运行中',passed:'通过',blocked:'阻断',completed:'全部完成'};
const statusSentence={waiting:'测试尚未开始。',running:'正在生成和验证固定人生种子。',blocked:'检测到失败种子，后续批次已阻断。',completed:'10,000 个固定人生种子已全部通过。'};
const progressUrl='https://raw.githubusercontent.com/ywang717/chinese-life-simulator/refs/heads/feature/balance-speed/dist/balance-progress.json';
let loading=false;

function renderCheckpoints(rows=[]){
  const root=$('[data-role="checkpoint-list"]');
  root.innerHTML=rows.map(row=>{
    const scanned=Number(row.scanned??0),percent=Math.min(100,Math.round(scanned/1000*100));
    const detail=row.status==='waiting'?'等待前序节点':row.status==='running'?'正在扫描 8 × 125 seeds':`${formatInt(row.passed)} 通过 · ${formatInt(row.failed)} 失败`;
    return `<article class="checkpoint-item ${esc(row.status)}">
      <div class="checkpoint-head"><strong>${formatInt(row.start)}–${formatInt(row.end)}</strong><span class="status-chip ${esc(row.status)}">${statusText[row.status]??esc(row.status)}</span></div>
      <div class="checkpoint-meta"><span>Checkpoint ${formatInt(row.checkpoint)}</span><span>${esc(detail)}</span></div>
      <div class="mini-progress"><span style="width:${percent}%"></span></div>
      ${row.throughput?`<small>${Number(row.throughput).toFixed(2)} seeds/s · ${formatDuration(row.elapsedMs)}</small>`:''}
    </article>`;
  }).join('');
}

function renderFailures(progress){
  const rows=progress.recentFailures??[];
  $('[data-role="failure-count"]').textContent=`${formatInt(progress.totalFailed)} 条`;
  $('[data-role="failed-seeds"]').innerHTML=rows.length?rows.slice().reverse().map(row=>`<div class="failure-row"><div><strong>${esc(row.seed)}</strong><small>#${formatInt(row.index)} · ${esc(row.city??'未知城市')}</small></div><span>${esc(row.error??'等待详细诊断')}</span></div>`).join(''):'<p class="empty compact-empty">目前没有失败种子。</p>';
}

function renderWarnings(progress){
  const rows=progress.warnings??[];
  $('[data-role="warnings"]').innerHTML=rows.length?`<ul class="warning-list">${rows.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty compact-empty">暂无警告</p>';
}

function render(progress){
  const ratio=Math.max(0,Math.min(1,Number(progress.progressRatio??0))),percent=(ratio*100).toFixed(ratio===1?0:1);
  $('[data-role="total-progress"]').innerHTML=`<strong>${formatInt(progress.completedSeeds)} / ${formatInt(progress.targetSeeds)}</strong><span>${percent}%</span>`;
  $('[data-role="progress-bar"]').style.width=`${percent}%`;
  $('[data-role="completed"]').textContent=formatInt(progress.completedSeeds);
  $('[data-role="scanned"]').textContent=formatInt(progress.scannedSeeds);
  $('[data-role="throughput"]').textContent=Number(progress.throughput??0).toFixed(2);
  $('[data-role="failed"]').textContent=formatInt(progress.totalFailed);
  $('[data-role="active-checkpoint"]').textContent=`Checkpoint ${formatInt(progress.activeCheckpoint)}`;
  $('[data-role="updated-at"]').textContent=formatTime(progress.updatedAt);
  $('[data-role="elapsed"]').textContent=formatDuration(progress.elapsedMs);
  $('[data-role="status-text"]').textContent=statusSentence[progress.overallStatus]??'正在读取测试状态。';
  const status=$('[data-role="overall-status"]');
  status.className=`status-chip ${progress.overallStatus}`;
  status.textContent=statusText[progress.overallStatus]??progress.overallStatus;
  renderCheckpoints(progress.checkpoints);
  renderFailures(progress);
  renderWarnings(progress);
}

async function load(){
  if(loading)return;
  loading=true;
  const button=document.querySelector('[data-action="refresh"]');
  if(button)button.disabled=true;
  try{
    const response=await fetch(progressUrl+'?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  }catch(error){
    $('[data-role="status-text"]').textContent=`读取进度失败：${error instanceof Error?error.message:String(error)}`;
  }finally{
    loading=false;
    if(button)button.disabled=false;
  }
}

document.querySelector('[data-action="refresh"]')?.addEventListener('click',load);
load();
setInterval(load,30000);
