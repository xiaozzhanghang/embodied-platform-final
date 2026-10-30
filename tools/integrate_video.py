import re

with open('public/annotation_workbench_interactive.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update meta in header
old_meta = '<div class="meta">任务ID <b>2110268909463343105</b><i>|</i>实例ID <b>75d24ecdc778de005052f5ee8a52a804</b><i>|</i>场景 <b>真实数据</b><i>|</i>数据帧数 <b>1791</b><i>|</i>设备类型 <b>聆动</b></div>'
new_meta = '<div class="meta">任务ID <b>2110268909463343105</b><i>|</i>实例ID <b>8925c733f9d6b464d49675015e4118e7</b><i>|</i>场景 <b>真实货架理货示范</b><i>|</i>视频源 <b>8925c733f9d6b464d49675015e4118e7.mov</b><i>|</i>总帧数 <b id="totalFrameMeta">23666 (13:08)</b><i>|</i>设备类型 <b>聆动具身机器人</b></div>'
if old_meta in html:
    html = html.replace(old_meta, new_meta)

# 2. Update h1
html = html.replace('<h1>聆动货架抓取</h1>', '<h1>聆动货架抓取 (真机示范视频标注)</h1><span class="chip green" style="margin-left:6px">8925c733f9d6b464...</span>')

# 3. Update video area to include <video> element
if '<video id="videoPlayer"' not in html:
    html = html.replace(
        '<div class="video" id="video">\n        <svg',
        '''<div class="video" id="video">
        <video id="videoPlayer" src="/8925c733f9d6b464d49675015e4118e7.mov" preload="auto" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;display:block;border-radius:8px;"></video>
        <svg id="mockSvg" style="display:none"'''
    )

# 4. Update camtabs to include 真实视频
old_camtabs = '<div class="camtabs opt-only" id="camTabs"><button data-c="ego_cam1" class="on">ego</button><button data-c="wrist_L">左腕</button><button data-c="wrist_R">右腕</button><button data-c="grid">并排</button></div>'
new_camtabs = '<div class="camtabs opt-only" id="camTabs"><button data-c="real" class="on">🎬 真实示范视频</button><button data-c="ego_cam1">3D 模拟图</button><button data-c="wrist_L">左腕</button><button data-c="wrist_R">右腕</button><button data-c="grid">并排</button></div>'
if old_camtabs in html:
    html = html.replace(old_camtabs, new_camtabs)

# 5. Update camLbl
html = html.replace('<div class="cam" id="camLbl">ego_cam1</div>', '<div class="cam" id="camLbl">Ego 真机示范 (8925c733f9d6...)</div>')

# 6. Update FPS, TOTAL, OBJS, TARGETS
html = html.replace('const FPS=29.36, TOTAL=1791;', 'let FPS=30.0, TOTAL=23666;')
html = html.replace(
    "const OBJS=['安慕希','可乐','矿泉水','薯片','盒装零食'];",
    "const OBJS=['乐事薯片(原味/红罐)','乐事薯片(青柠/绿罐)','乐事薯片(樱花/粉罐)','乐事薯片(黑松露/蓝罐)','合味道泡面','黄油面包','可乐','矿泉水'];"
)
html = html.replace(
    "const TARGETS=['台面上方','桌面','货架上层','货架下层','篮筐'];",
    "const TARGETS=['货架上层','货架中层','货架下层','购物车','操作台面'];"
)

# 7. Update initial steps for 8925c733f9d6b464d49675015e4118e7
old_init_steps = '''let steps=[
 {id:1,hand:'L',skill:'Grasp(抓取)',obj:'安慕希',from:'台面上方',to:'桌面',s:0,e:300},
 {id:2,hand:'R',skill:'Reset(复位)',obj:'安慕希',from:'桌面',to:'台面上方',s:301,e:600}];'''

new_init_steps = '''let steps=[
 {id:1,hand:'L',skill:'Grasp(抓取)',obj:'乐事薯片(原味/红罐)',from:'货架上层',to:'操作台面',s:0,e:450},
 {id:2,hand:'R',skill:'Place(放置)',obj:'乐事薯片(原味/红罐)',from:'操作台面',to:'购物车',s:451,e:900},
 {id:3,hand:'R',skill:'Reset(复位)',obj:'乐事薯片(原味/红罐)',from:'购物车',to:'操作台面',s:901,e:1350}];'''
if old_init_steps in html:
    html = html.replace(old_init_steps, new_init_steps)

# 8. Update DEF_STEPS demo reset
old_def = "const DEF_STEPS=()=>[{id:1,hand:'L',skill:'Grasp(抓取)',obj:'安慕希',from:'台面上方',to:'桌面',s:0,e:300},{id:2,hand:'R',skill:'Reset(复位)',obj:'安慕希',from:'桌面',to:'台面上方',s:301,e:600}];"
new_def = "const DEF_STEPS=()=>[{id:1,hand:'L',skill:'Grasp(抓取)',obj:'乐事薯片(原味/红罐)',from:'货架上层',to:'操作台面',s:0,e:450},{id:2,hand:'R',skill:'Place(放置)',obj:'乐事薯片(原味/红罐)',from:'操作台面',to:'购物车',s:451,e:900},{id:3,hand:'R',skill:'Reset(复位)',obj:'乐事薯片(原味/红罐)',from:'购物车',to:'操作台面',s:901,e:1350}];"
if old_def in html:
    html = html.replace(old_def, new_def)

# 9. Update setCam
old_setcam = '''function setCam(c){
  document.querySelectorAll('#camTabs button').forEach(b=>b.classList.toggle('on',b.dataset.c===c));
  const lab={ego_cam1:'ego_cam1',wrist_L:'wrist_cam_left',wrist_R:'wrist_cam_right',grid:'ego_cam1 + 双腕'};
  $('#camLbl').textContent=lab[c];
  $('#video svg').style.filter=c==='wrist_L'?'hue-rotate(35deg) saturate(1.2)':c==='wrist_R'?'hue-rotate(-35deg) saturate(1.2)':'';
  $('#pip').classList.toggle('show',c==='grid');
}'''

new_setcam = '''function setCam(c){
  document.querySelectorAll('#camTabs button').forEach(b=>b.classList.toggle('on',b.dataset.c===c));
  const vp=$('#videoPlayer'),svg=$('#mockSvg');
  if(c==='real'){
    if(vp)vp.style.display='block';
    if(svg)svg.style.display='none';
    $('#camLbl').textContent='Ego 真机示范 (8925c733f9d6...)';
    $('#pip').classList.remove('show');
  }else if(c==='ego_cam1'){
    if(vp)vp.style.display='none';
    if(svg)svg.style.display='block';
    $('#camLbl').textContent='3D 模拟视角';
    if(svg)svg.style.filter='';
    $('#pip').classList.remove('show');
  }else if(c==='wrist_L'){
    if(vp)vp.style.display='none';
    if(svg)svg.style.display='block';
    $('#camLbl').textContent='左腕视角 (示意)';
    if(svg)svg.style.filter='hue-rotate(35deg) saturate(1.2)';
    $('#pip').classList.remove('show');
  }else if(c==='wrist_R'){
    if(vp)vp.style.display='none';
    if(svg)svg.style.display='block';
    $('#camLbl').textContent='右腕视角 (示意)';
    if(svg)svg.style.filter='hue-rotate(-35deg) saturate(1.2)';
    $('#pip').classList.remove('show');
  }else if(c==='grid'){
    if(vp)vp.style.display='block';
    $('#camLbl').textContent='Ego 真机示范 + 双腕画中画';
    $('#pip').classList.add('show');
  }
}'''
if old_setcam in html:
    html = html.replace(old_setcam, new_setcam)

# 10. Update playback functions (seek, tick, setPlay, speed)
old_playback = '''function seek(f){
  cur=clamp(f,0,TOTAL-1);
  if(mode==='opt'&&(cur<vs||cur>vs+vw)){setView(cur-vw/2,vw);renderTimeline();renderMinimap();updZoomUI()}
  updatePlayhead();updCtrl();
}
let lastTs=0;
function tick(ts){
  if(!playing)return;
  const dt=Math.min(0.1,(ts-lastTs)/1000);lastTs=ts;cur+=dt*FPS*speed;
  const st=selStep();
  if(loop&&mode==='opt'&&st&&(cur>st.e||cur<st.s))cur=st.s;
  if(cur>=TOTAL-1){cur=TOTAL-1;setPlay(false)}
  if(mode==='opt'&&vw<TOTAL&&(cur<vs||cur>vs+vw)){setView(cur-vw*0.15,vw);renderTimeline();renderMinimap();updZoomUI()}
  updatePlayhead();updCtrl();
  if(playing)requestAnimationFrame(tick);
}
function setPlay(v){
  playing=v;$('#bPlay').textContent=v?'⏸':'▶';
  if(v){if(cur>=TOTAL-1)cur=0;lastTs=performance.now();requestAnimationFrame(tick)}
}'''

new_playback = '''const vid=()=>$('#videoPlayer');
function seek(f){
  cur=clamp(f,0,TOTAL-1);
  const v=vid();
  if(v && Math.abs(v.currentTime - cur/FPS) > 0.033){
    try{ v.currentTime = cur / FPS; }catch(e){}
  }
  if(mode==='opt'&&(cur<vs||cur>vs+vw)){setView(cur-vw/2,vw);renderTimeline();renderMinimap();updZoomUI()}
  updatePlayhead();updCtrl();
}
let lastTs=0;
function tick(ts){
  if(!playing)return;
  const player=vid();
  if(player && !player.paused && !player.ended){
    cur=clamp(Math.round(player.currentTime*FPS),0,TOTAL-1);
  }else{
    const dt=Math.min(0.1,(ts-lastTs)/1000);
    cur=clamp(cur+dt*FPS*speed,0,TOTAL-1);
  }
  lastTs=ts;
  const st=selStep();
  if(loop&&mode==='opt'&&st&&(cur>st.e||cur<st.s)){
    seek(st.s);
  }
  if(cur>=TOTAL-1){
    cur=TOTAL-1;
    setPlay(false);
  }
  if(mode==='opt'&&vw<TOTAL&&(cur<vs||cur>vs+vw)){
    setView(cur-vw*0.15,vw);
    renderTimeline();renderMinimap();updZoomUI();
  }
  updatePlayhead();updCtrl();
  if(playing)requestAnimationFrame(tick);
}
function setPlay(v){
  playing=v;$('#bPlay').textContent=v?'⏸':'▶';
  const player=vid();
  if(v){
    if(cur>=TOTAL-1)seek(0);
    if(player){
      player.playbackRate=speed;
      player.play().catch(e=>console.log('Video play caught:',e));
    }
    lastTs=performance.now();
    requestAnimationFrame(tick);
  }else{
    if(player)player.pause();
  }
}'''
if old_playback in html:
    html = html.replace(old_playback, new_playback)

# 11. Add video event listeners
if "vp.addEventListener('loadedmetadata'" not in html:
    old_tail = "buildDrawer('all');buildSpeed();setMode('opt');"
    new_tail = '''// 初始化视频元数据与播放同步
const vp=$('#videoPlayer');
if(vp){
  vp.addEventListener('loadedmetadata',()=>{
    if(vp.duration && vp.duration>0){
      TOTAL=Math.round(vp.duration*FPS);
      $('#frameTot').textContent='/ '+TOTAL;
      $('#durTot').textContent='/ '+fmt(TOTAL);
      const m=$('#totalFrameMeta');
      if(m)m.textContent=TOTAL+' ('+fmt(TOTAL)+')';
      vw=Math.min(TOTAL,1800);
      renderAll();
    }
  });
  vp.addEventListener('play',()=>{if(!playing)setPlay(true)});
  vp.addEventListener('pause',()=>{if(playing)setPlay(false)});
  vp.addEventListener('ended',()=>{setPlay(false)});
}
buildDrawer('all');buildSpeed();setMode('opt');'''
    html = html.replace(old_tail, new_tail)

with open('public/annotation_workbench_interactive.html', 'w', encoding='utf-8') as out1:
    out1.write(html)
with open('out/annotation_workbench_interactive.html', 'w', encoding='utf-8') as out2:
    out2.write(html)

print('Updated both public/ and out/ annotation_workbench_interactive.html successfully!')
