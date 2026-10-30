<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>具身智能标注工作台 · 交互优化原型 (Pro版 · 动力学曲线/自动切刀/37项体验优化)</title>
<style>
:root{--blue:#1677ff;--orange:#fa8c16;--red:#f5222d;--green:#2db84d;--purple:#722ed1;--cyan:#13c2c2;--bd:#e5e7eb;--tx:#1f2329;--tx2:#6b7280;--bg:#f0f2f5}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
button{font:inherit;cursor:pointer}
/* 原型工具条 */
.proto-bar{position:sticky;top:0;z-index:50;background:#1f2433;color:#fff;display:flex;align-items:center;gap:16px;padding:8px 16px;flex-wrap:wrap}
.proto-bar b{font-size:15px;display:flex;align-items:center;gap:6px}
.proto-bar .sp{flex:1}
.seg{display:inline-flex;background:#3a4157;border-radius:6px;padding:2px}
.seg button{border:0;background:transparent;color:#cbd2e4;padding:4px 12px;border-radius:5px;font-size:13px}
.seg button.on{background:#fff;color:#1f2433;font-weight:600}
.pbtn{border:1px solid #5a6384;background:transparent;color:#fff;border-radius:6px;padding:4px 12px;font-size:13px}
.pbtn:hover{background:#3a4157}
.sw{display:inline-flex;align-items:center;gap:6px;cursor:pointer;user-select:none;font-size:13px}
.sw input{accent-color:#ff4d4f}
.hint{color:#9aa3bd;font-size:12px}
/* 工作台 */
.wb{margin:12px;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.wb-head{padding:12px 20px 10px;border-bottom:1px solid var(--bd);position:relative}
.wb-head h1{display:inline;font-size:18px;margin:0 8px 0 0}
.chip{display:inline-block;padding:1px 10px;border-radius:4px;color:#fff;font-size:13px;font-weight:600;vertical-align:2px;margin-right:6px}
.chip.blue{background:var(--blue)}.chip.orange{background:var(--orange)}.chip.red{background:#e5484d}.chip.green{background:#2db84d}
.meta{color:var(--tx2);font-size:13px;margin-top:2px}.meta b{color:var(--tx)}.meta i{margin:0 8px;color:#d0d4db;font-style:normal}
.xbtn{position:absolute;right:18px;top:14px;font-size:22px;color:#9aa0aa;border:0;background:none}
.wb-body{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:14px;padding:14px}
.video{position:relative;height:400px;background:#0e0e10;border-radius:8px}
.video svg{width:100%;height:100%;display:block;border-radius:8px}
.cam{position:absolute;left:12px;top:12px;background:rgba(255,255,255,.85);border-radius:4px;padding:1px 10px;font:13px monospace}
.vstep{position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.65);color:#fff;border-radius:6px;padding:4px 12px;font-size:13px}
.vstep.none{background:rgba(250,140,22,.9)}
.vframe{position:absolute;right:14px;bottom:10px;color:rgba(255,255,255,.55);font:12px monospace}
.tlwrap{margin-top:10px}
.tl-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 0;font-size:13px;position:relative}
.tl-tools .grp{display:flex;align-items:center;gap:4px}
.mini-btn{border:1px solid var(--bd);background:#fff;border-radius:5px;padding:2px 9px;color:var(--tx)}
.mini-btn:hover{border-color:var(--blue);color:var(--blue)}
.mini-btn.on{background:#e6f0ff;border-color:var(--blue);color:var(--blue)}
.tl-tools input[type=range]{width:130px;accent-color:var(--blue)}
.vinfo{color:var(--tx2);margin-left:auto;font-size:12px}
.timeline{position:relative;border:1px solid var(--bd);border-radius:6px;background:#fff}
.tlclip{position:relative;overflow:hidden;border-radius:6px;user-select:none}
.ruler-wrap{position:relative;border-bottom:1px solid var(--bd);background:#fafbfc;cursor:pointer}
.ruler{position:relative;height:30px}
.ruler.opt{height:44px}
.tk{position:absolute;top:0;font-size:12px;color:#444;white-space:nowrap}
.tk::after{content:"";position:absolute;left:0;top:18px;width:1px;height:10px;background:#9ca3af}
.tk span{position:absolute;left:-18px;top:0;width:36px;text-align:center}
.tk.first span{left:0;text-align:left}
.tk.mn::after{height:5px;top:23px;background:#d1d5db}
.fk{position:absolute;top:30px;font-size:10px;color:#9ca3af}
.fk::before{content:"";position:absolute;left:0;top:-4px;height:4px;width:1px;background:#d1d5db}
.fk span{position:absolute;left:-14px;width:28px;text-align:center;top:2px}
.lanes-wrap{position:relative}
.lanes{position:relative}
.lane{position:relative;height:46px;border-bottom:1px dashed #e5e7eb;background:#fff}
.lane:last-child{border-bottom:0}
.lane-lb{position:absolute;left:6px;top:2px;font-size:11px;color:#9ca3af;pointer-events:none}
.blk{position:absolute;top:6px;bottom:6px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 10%,#fff);border-radius:7px;display:flex;align-items:center;gap:6px;padding:0 10px;cursor:grab;overflow:hidden;z-index:3}
.blk.sel{box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent);background:color-mix(in srgb,var(--c) 18%,#fff)}
.blk .num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--c);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.blk .bt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;font-size:13px}
.blk .bf{flex:none;background:rgba(0,0,0,.06);border-radius:4px;padding:0 6px;font-size:12px}
.blk.narrow .bt,.blk.narrow .bf{display:none}
.hchip{flex:none;font-size:11px;font-weight:700;color:#fff;border-radius:4px;padding:0 5px;line-height:16px}
.hchip.L{background:#2f6df6}.hchip.R{background:#e8590c}
.blk .h{position:absolute;top:0;bottom:0;width:8px;cursor:ew-resize;background:var(--c);opacity:.55}
.blk.sel .h{opacity:1}
.blk .h-l{left:0}.blk .h-r{right:0}
.gaps{position:absolute;inset:0;pointer-events:none;z-index:1}
.gap{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,rgba(250,140,22,.14) 0 6px,rgba(250,140,22,.04) 6px 12px);border-left:1px dashed rgba(250,140,22,.6);border-right:1px dashed rgba(250,140,22,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#b45309}
.gap button{pointer-events:auto;border:1px dashed var(--orange);background:#fff;color:#b45309;border-radius:5px;padding:1px 10px}
.playhead{position:absolute;top:0;bottom:0;width:0;z-index:6;pointer-events:none}
.playhead::before{content:"";position:absolute;left:-1px;top:0;bottom:0;width:2px;background:var(--red)}
.playhead::after{content:"";position:absolute;left:-6px;top:0;border:6px solid transparent;border-top:9px solid var(--red)}
.ctrl{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 10px;border:1px solid var(--bd);border-radius:8px;flex-wrap:wrap}
.cchip{display:inline-flex;align-items:center;gap:6px;border:1px solid #d9e2f3;border-radius:6px;padding:3px 10px;background:#fff;position:relative}
.cchip .tag{background:#eef1f6;border-radius:4px;padding:0 6px;font-size:13px}
.cchip .tag.b{background:var(--blue);color:#fff;font-weight:700}
.cchip .v{font:600 17px/1 monospace;color:var(--blue)}
.cchip input{width:62px;border:0;font:600 17px monospace;color:var(--blue);text-align:right;outline:none;background:transparent}
.tr{display:flex;align-items:center;gap:8px;margin:0 6px}
.tr button{border:0;background:none;color:#6b7280;font-size:18px;padding:2px 6px}
.tr .play{width:42px;height:42px;border-radius:50%;background:var(--blue);color:#fff;font-size:16px}
select,input[type=text],input[type=number]{font:inherit}
.sel-w select{border:1px solid var(--bd);border-radius:6px;padding:4px 8px;background:#fff}

/* 具身机器人动力学时序曲线 (Kinematic Curves) */
.curves-panel{margin-top:8px;border:1px solid #cbd5e1;border-radius:6px;background:#090d16;color:#e2e8f0;overflow:hidden;position:relative}
.curves-head{padding:6px 12px;background:#131b2e;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;font-size:12px}
.curves-head b{color:#38bdf8;display:flex;align-items:center;gap:6px}
.curves-legends{display:flex;gap:12px;align-items:center}
.leg-item{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600}
.leg-dot{width:8px;height:8px;border-radius:50%}
.curves-canvas-wrap{position:relative;height:90px;width:100%;background:#090d16;user-select:none;cursor:crosshair}
.curves-canvas{width:100%;height:100%;display:block}
.curves-playhead{position:absolute;top:0;bottom:0;width:1px;background:#f5222d;pointer-events:none;z-index:5}
.curves-val-hud{position:absolute;left:8px;bottom:4px;display:flex;gap:12px;font:11px/1 monospace;background:rgba(15,23,42,0.85);padding:3px 8px;border-radius:4px;border:1px solid #334155;pointer-events:none}

/* 自动切刀推荐候选线 (Auto-Cut Recommendations) */
.cut-cand{position:absolute;top:0;bottom:0;width:0;z-index:4;pointer-events:auto;cursor:pointer}
.cut-cand::before{content:"";position:absolute;left:-1px;top:0;bottom:0;width:1px;border-left:1px dashed #faad14}
.cut-cand .cand-btn{position:absolute;top:2px;left:-24px;background:#faad14;color:#000;font-size:10px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.4);border:1px solid #fff;display:none}
.cut-cand:hover .cand-btn{display:block}
.cut-cand:hover::before{border-left:2px solid #ff4d4f}

/* 右侧 */
.right{display:flex;flex-direction:column;border:1px solid var(--bd);border-radius:8px;min-height:640px;max-height:calc(100vh - 90px);position:sticky;top:56px}
.rtab{padding:10px 16px;border-bottom:1px solid var(--bd);color:var(--blue);font-weight:600}
.rbody{padding:14px 14px;overflow:auto;flex:1}
.lbl{color:var(--tx2);margin-bottom:6px}
.big2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bigbtn{border:0;color:#fff;border-radius:6px;padding:12px 6px;font-weight:700;font-size:15px;position:relative}
.bigbtn.b{background:var(--blue)}.bigbtn.o{background:#fa8c16}
.bigbtn small{display:block;font-weight:400;font-size:11px;opacity:.9}
.shead{display:flex;align-items:center;justify-content:space-between;margin:16px 0 10px;font-weight:700;position:relative}
.shead .acts{display:flex;gap:8px}
.obtn{border:1px solid var(--blue);color:var(--blue);background:#fff;border-radius:5px;padding:2px 10px;font-size:13px}
.sbtn{border:0;color:#fff;background:var(--blue);border-radius:5px;padding:3px 12px;font-size:13px;position:relative}
.card{border:1px solid var(--bd);border-radius:8px;margin-bottom:10px;background:#fff;position:relative}
.card.sel{border:2px solid var(--blue)}
.chd{display:flex;align-items:center;gap:8px;padding:9px 10px;position:relative;cursor:pointer}
.chd .n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--c);color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center}
.chd .ttl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.chd .rng{flex:none;position:relative;background:#eef3ff;color:#3b5bdb;border-radius:12px;padding:0 10px;font-size:12px;border:1px solid #cfdcff}
.chd .ic{flex:none;border:0;background:none;color:#9ca3af;padding:2px 3px;font-size:15px;position:relative}
.chd .ic:hover{color:var(--blue)}.chd .ic.del:hover{color:var(--red)}
.sum{padding:0 12px 9px 46px;color:var(--tx2);font-size:12px;margin-top:-4px}
.cbody{padding:4px 14px 14px;border-top:1px solid var(--bd)}
.fld{margin-top:10px}
.fld label{display:block;color:var(--tx2);font-size:13px;margin-bottom:4px}
.fld select,.fld input[type=text],.fld input[type=number]{width:100%;border:1px solid var(--bd);border-radius:6px;padding:7px 10px;background:#fff}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.frm{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}
.frames{display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative}
.f{position:relative}
.mini{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
.mini button{border:1px solid var(--bd);background:#fff;border-radius:4px;font-size:12px;padding:0 6px;color:var(--tx)}
.mini button:hover{border-color:var(--blue);color:var(--blue)}
.rfoot{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 14px;border-top:1px solid var(--bd)}
.fbtn{border-radius:6px;padding:10px;font-weight:600;position:relative}
.fbtn.ghost{background:#fff;border:1px solid #8b5cf6;color:#7c3aed}
.fbtn.main{background:var(--blue);color:#fff;border:0}
body.mode-opt .fbtn.ghost{border-color:var(--bd);color:var(--tx2);font-weight:400}
/* 模式显示 */
body.mode-old .opt-only{display:none!important}
body.mode-opt .old-only{display:none!important}
/* 标注徽标 */
.abadge{position:absolute;z-index:40;min-width:20px;height:20px;border-radius:10px;padding:0 5px;color:#fff;font:700 12px/20px sans-serif;text-align:center;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid #fff;box-sizing:content-box;display:block}
.abadge.pP0{background:#e5484d}.abadge.pP1{background:#f08a00}.abadge.pP2{background:#6b7fb0}
.abadge.pulse{animation:pl .7s 3}
@keyframes pl{50%{transform:scale(1.6)}}
body.ann-off .abadge{display:none!important}
.pop{position:fixed;z-index:100;width:330px;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.28);border:1px solid #e5e7eb;padding:12px 14px;display:none;font-size:13px}
.pop h4{margin:0 0 6px;font-size:14px;display:flex;align-items:center;gap:8px}
.pop .row{margin-top:6px}.pop .row b{display:block;color:var(--tx2);font-weight:600;font-size:12px}
.tagp{font-size:11px;font-weight:700;color:#fff;border-radius:4px;padding:0 6px}
.tagp.P0{background:#e5484d}.tagp.P1{background:#f08a00}.tagp.P2{background:#6b7fb0}
.drawer{position:fixed;right:0;top:46px;bottom:0;width:400px;z-index:60;background:#fff;box-shadow:-6px 0 24px rgba(0,0,0,.2);display:none;flex-direction:column}
.drawer.open{display:flex}
.drawer header{padding:12px 16px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px}
.drawer header b{flex:1}
.flt{display:flex;gap:6px;padding:8px 16px;border-bottom:1px solid var(--bd)}
.dlist{overflow:auto;flex:1;padding:8px 12px 20px}
.ditem{display:flex;gap:10px;padding:10px 6px;border-bottom:1px solid #f0f1f3;cursor:pointer}
.ditem:hover{background:#f7f9fc}
.ditem .dn{flex:none;width:24px;height:24px;border-radius:50%;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center}
.dn.P0{background:#e5484d}.dn.P1{background:#f08a00}.dn.P2{background:#6b7fb0}
.ditem h5{margin:0;font-size:13.5px;display:flex;gap:6px;align-items:center}
.ditem p{margin:3px 0 0;font-size:12px;color:var(--tx2)}
.toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#1f2433;color:#fff;padding:8px 16px;border-radius:8px;z-index:200;display:none;font-size:13px}
.toast a{color:#7cb4ff;margin-left:10px;cursor:pointer}
.tip{position:fixed;z-index:150;background:#1f2433;color:#fff;border-radius:5px;padding:2px 8px;font-size:12px;display:none;pointer-events:none}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:none;align-items:center;justify-content:center}
.modal{background:#fff;border-radius:10px;width:min(520px,92vw);max-height:80vh;overflow:auto;padding:18px 22px}
.modal h3{margin:0 0 10px}
.modal table{width:100%;border-collapse:collapse;font-size:13px}
.modal td{padding:5px 4px;border-bottom:1px solid #f0f1f3}
.modal kbd{background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:0 6px;font:12px monospace}
.ok{color:#2db84d}.bad{color:#e5484d}
.link{color:var(--blue);cursor:pointer;text-decoration:underline}
body.mode-old .abadge.optonly{display:none!important}
.hd-r{position:absolute;right:56px;top:12px;display:flex;gap:8px;align-items:center;font-size:12px;color:var(--tx2)}
.hd-r .pill{border:1px solid var(--bd);border-radius:12px;padding:1px 18px 1px 12px;background:#fff;position:relative;white-space:nowrap;font:inherit;font-size:12px;color:var(--tx2)}
.hd-r .pill.ok{color:#237804;border-color:#b7ebc6;background:#f0fff4}
.hd-r button.pill{cursor:pointer;color:var(--tx)}
.hd-r button.pill:hover{border-color:var(--blue);color:var(--blue)}
.camtabs{position:absolute;right:12px;top:12px;display:flex;gap:4px;z-index:5}
.camtabs button{border:0;background:rgba(255,255,255,.82);border-radius:4px;padding:1px 10px;font:12px monospace}
.camtabs button.on{background:var(--blue);color:#fff}
.pip{position:absolute;right:12px;top:48px;display:none;flex-direction:column;gap:8px;z-index:4}
.pip.show{display:flex}
.pip div{width:170px;height:96px;border-radius:6px;border:2px solid #fff;color:#fff;font:11px monospace;padding:2px 6px;background:linear-gradient(135deg,#59627a,#2b2f3a)}
.hot{fill:rgba(22,119,255,0);stroke:transparent;stroke-width:3;cursor:pointer}
.hot:hover{fill:rgba(22,119,255,.25);stroke:#4da3ff}
.cmt{position:absolute;top:12px;z-index:5;cursor:pointer;font-size:12px;line-height:1}
.ctx{position:fixed;z-index:250;background:#fff;border:1px solid var(--bd);border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.22);padding:4px;display:none;min-width:210px}
.ctx button{display:block;width:100%;text-align:left;border:0;background:none;padding:6px 12px;border-radius:5px;font-size:13px}
.ctx button:hover{background:#eef3ff;color:var(--blue)}
.ctx button.dis{color:#b0b5bf;pointer-events:none}
.ctx hr{border:0;border-top:1px solid var(--bd);margin:4px 0}
.rowx span{white-space:nowrap}
.rowx{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;position:relative;font-size:13px}
.rowx select,.rowx input{border:1px solid var(--bd);border-radius:6px;padding:3px 8px;background:#fff;font:inherit;font-size:13px}
.rowx input{flex:1;min-width:90px}
.warnrow{padding:0 12px 8px 46px;color:#ad4e00;font-size:12px}
.card.locked{background:#fafafa}
.card.locked .cbody{pointer-events:none;opacity:.55}
.tplrow{display:flex;gap:8px;margin:0 0 10px;position:relative}
.tplrow select{flex:1;border:1px solid var(--bd);border-radius:6px;padding:4px 8px;background:#fff;min-width:0}
.rep{display:flex;gap:6px;align-items:center;margin-top:12px;font-size:12px;color:var(--tx2);position:relative;flex-wrap:wrap}
.flow{grid-column:1/-1;display:flex;gap:8px;align-items:center;font-size:12px;color:var(--tx2);position:relative;flex-wrap:wrap}
.blk.locked{background:repeating-linear-gradient(135deg,#f3f4f6 0 6px,#fff 6px 12px);cursor:not-allowed}
.tagnew{font-size:11px;color:#0958d9;background:#e6f4ff;border-radius:4px;padding:0 6px}
.pop .demo{background:#f6ffed;border-radius:6px;padding:4px 8px;color:#237804}
body.mode-opt.focus-video .wb-body{grid-template-columns:minmax(0,1fr) 0}
body.mode-opt.focus-video .right{display:none}
body.mode-opt.big-video .video{height:520px}
</style>
</head>
<body class="mode-opt">

<div class="proto-bar">
  <b>🤖 具身智能标注工作台 · 交互优化原型 <span style="font-size:11px;background:#1677ff;padding:1px 6px;border-radius:4px">Pro 动力学切刀版</span></b>
  <span class="seg" id="modeSeg"><button data-m="old">现状版本</button><button data-m="opt" class="on">优化版本</button></span>
  <label class="sw"><input type="checkbox" id="annToggle" checked>显示体验优化标注</label>
  <button class="pbtn" id="btnList">优化清单（37项全部可测）</button>
  <span class="sp"></span>
  <span class="hint">红=P0 橙=P1 灰蓝=P2 · 包含动力学时序曲线 & 自动切刀推荐</span>
</div>

<div class="wb">
  <div class="wb-head">
    <h1>聆动货架抓取 (G1 机械臂双目示教)</h1>
    <span class="chip blue">Ego 第一视角</span><span class="chip orange" id="stChip" style="position:relative"><span id="stTxt">未标注</span></span>
    <div class="meta">任务ID <b>2110268909463343105</b><i>|</i>实例ID <b>75d24ecdc778de005052f5ee8a52a804</b><i>|</i>场景 <b>真实物理操纵</b><i>|</i>数据帧数 <b>1791</b><i>|</i>机器人本体 <b>Unitree G1 29-DOF</b></div>
    <div class="hd-r opt-only">
      <span class="pill ok" id="preload"><span id="preTxt">下一条 4/20 已预加载 ✓</span></span>
      <button class="pill" id="telem"><span id="telemTxt">⏱ 本条 00:00</span></button>
      <span class="pill" id="layoutBtns" style="padding:0"><button class="pill" id="btnBig" style="border:0">⤢ 放大视频</button><button class="pill" id="btnFold" style="border:0">▣ 折叠面板</button></span>
    </div>
    <button class="xbtn">×</button>
  </div>

  <div class="wb-body">
    <section>
      <div class="video" id="video">
        <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
          <defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f4a"/><stop offset="1" stop-color="#1c1e24"/></linearGradient></defs>
          <rect width="800" height="450" fill="url(#bgg)"/>
          <rect x="30" y="170" width="740" height="26" rx="4" fill="#b8282d"/>
          <rect x="30" y="330" width="740" height="26" rx="4" fill="#b8282d"/>
          <g>
            <rect x="60" y="70" width="70" height="100" rx="8" fill="#6bbf4a"/><rect x="150" y="60" width="70" height="110" rx="8" fill="#e5b520"/><rect x="240" y="100" width="130" height="70" rx="4" fill="#e8d878"/>
            <rect x="420" y="55" width="70" height="115" rx="8" fill="#d8402f"/><rect x="520" y="80" width="90" height="90" rx="4" fill="#c9382c"/><rect x="630" y="90" width="110" height="80" rx="4" fill="#d44b3a"/>
            <rect x="70" y="240" width="36" height="90" rx="10" fill="#2c3036"/><rect x="130" y="250" width="34" height="80" rx="10" fill="#8fb8d6"/><rect x="200" y="245" width="34" height="85" rx="10" fill="#8fb8d6"/>
            <rect x="330" y="240" width="36" height="90" rx="10" fill="#2c3036"/><rect x="400" y="250" width="34" height="80" rx="10" fill="#8fb8d6"/><rect x="470" y="240" width="36" height="90" rx="10" fill="#2c3036"/><rect x="560" y="250" width="34" height="80" rx="10" fill="#8fb8d6"/>
          </g>
          <g id="gL"><rect x="40" y="380" width="120" height="70" rx="14" fill="#cfd3da"/><rect x="150" y="395" width="70" height="16" rx="6" fill="#d0342c"/></g>
          <g id="gR"><rect x="640" y="380" width="120" height="70" rx="14" fill="#cfd3da"/><rect x="580" y="395" width="70" height="16" rx="6" fill="#d0342c"/></g>
          <g class="opt-only" id="hots">
            <rect class="hot" data-o="薯片" x="60" y="70" width="70" height="100"><title>点击设为操作对象：薯片</title></rect>
            <rect class="hot" data-o="薯片" x="150" y="60" width="70" height="110"><title>点击设为操作对象：薯片</title></rect>
            <rect class="hot" data-o="盒装零食" x="240" y="100" width="130" height="70"><title>点击设为操作对象：盒装零食</title></rect>
            <rect class="hot" data-o="可乐" x="420" y="55" width="70" height="115"><title>点击设为操作对象：可乐</title></rect>
            <rect class="hot" data-o="安慕希" x="520" y="80" width="90" height="90"><title>点击设为操作对象：安慕希</title></rect>
            <rect class="hot" data-o="盒装零食" x="630" y="90" width="110" height="80"><title>点击设为操作对象：盒装零食</title></rect>
            <rect class="hot" data-o="可乐" x="70" y="240" width="36" height="90"><title>点击设为操作对象：可乐</title></rect>
            <rect class="hot" data-o="矿泉水" x="130" y="250" width="34" height="80"><title>点击设为操作对象：矿泉水</title></rect>
            <rect class="hot" data-o="矿泉水" x="200" y="245" width="34" height="85"><title>点击设为操作对象：矿泉水</title></rect>
            <rect class="hot" data-o="可乐" x="330" y="240" width="36" height="90"><title>点击设为操作对象：可乐</title></rect>
            <rect class="hot" data-o="矿泉水" x="400" y="250" width="34" height="80"><title>点击设为操作对象：矿泉水</title></rect>
            <rect class="hot" data-o="可乐" x="470" y="240" width="36" height="90"><title>点击设为操作对象：可乐</title></rect>
            <rect class="hot" data-o="矿泉水" x="560" y="250" width="34" height="80"><title>点击设为操作对象：矿泉水</title></rect>
          </g>
        </svg>
        <div class="cam" id="camLbl">ego_cam1</div>
        <div class="camtabs opt-only" id="camTabs"><button data-c="ego_cam1" class="on">ego</button><button data-c="wrist_L">左腕</button><button data-c="wrist_R">右腕</button><button data-c="grid">并排</button></div>
        <div class="pip" id="pip"><div>wrist_cam_left</div><div>wrist_cam_right</div></div>
        <div class="vstep opt-only" id="vStep"><span id="vStepTxt"></span></div>
        <div class="vframe" id="vFrame"></div>
      </div>

      <div class="tlwrap">
        <div class="tl-tools opt-only" id="zoomTools">
          <div class="grp">
            <button class="mini-btn" id="zOut" title="缩小（-）">－</button>
            <input type="range" id="zRange" min="0" max="100" step="1" value="0">
            <button class="mini-btn" id="zIn" title="放大（+）">＋</button>
            <span id="zLabel" style="min-width:48px">1.0×</span>
          </div>
          <div class="grp">
            <button class="mini-btn" id="zFit">适配全部</button>
            <button class="mini-btn" id="zSel">聚焦所选</button>
            <button class="mini-btn" id="zGap">跳到未标注</button>
            <button class="mini-btn on" id="toggleCurvesBtn" title="折叠/展开动力学曲线">📉 动力学曲线通道</button>
          </div>
          <span class="vinfo" id="vInfo"></span>
        </div>

        <div class="timeline" id="timeline">
          <div class="tlclip" id="tlclip">
            <div class="ruler-wrap" id="rulerWrap"><div class="ruler" id="ruler"></div></div>
            <div class="lanes-wrap" id="lanesWrap">
              <div class="lanes" id="lanes"></div>
              <div class="gaps opt-only" id="gaps"></div>
              <div id="cutCandLines" class="opt-only"></div>
            </div>
            <div class="playhead" id="playhead"></div>
          </div>
        </div>

        <!-- 机器人多模态动力学时序曲线面板 -->
        <div class="curves-panel opt-only" id="curvesPanel">
          <div class="curves-head">
            <b>⚡ 机械臂多模态物理动力学曲线 (Kinematic & Dynamics Curve Track · 60Hz硬件同步)</b>
            <div class="curves-legends">
              <span class="leg-item" style="color:#00f2fe"><span class="leg-dot" style="background:#00f2fe"></span>夹爪开合度 (Aperture 0~100%)</span>
              <span class="leg-item" style="color:#fa8c16"><span class="leg-dot" style="background:#fa8c16"></span>末端线速度 (EEF Vel 0~1.2m/s)</span>
              <span class="leg-item" style="color:#a855f7"><span class="leg-dot" style="background:#a855f7"></span>接触力矩 (Torque 0~45N·m)</span>
              <span class="leg-item" style="color:#faad14"><span style="border-bottom:1px dashed #faad14;width:12px;height:0;display:inline-block"></span>自动切刀候选 (Auto-Cut)</span>
            </div>
          </div>
          <div class="curves-canvas-wrap" id="curvesCanvasWrap">
            <canvas id="curvesCanvas" class="curves-canvas"></canvas>
            <div class="curves-playhead" id="curvesPlayhead"></div>
            <div class="curves-val-hud" id="curvesHud">
              <span style="color:#00f2fe">夹爪: <b id="hudGrip">0%</b></span>
              <span style="color:#fa8c16">速度: <b id="hudVel">0.00 m/s</b></span>
              <span style="color:#a855f7">力矩: <b id="hudTorque">0.0 N·m</b></span>
              <span style="color:#64748b">接触状态: <b id="hudContact" style="color:#10b981">空载自由移动</b></span>
            </div>
          </div>
        </div>

        <div class="ctrl">
          <span class="cchip" id="chipDur"><span class="tag">时长</span><span class="v" id="durTxt">01:01</span></span>
          <span class="cchip" id="chipFrame"><span class="tag b">帧</span><input type="number" id="frameIn" value="0" min="0"><span class="v" style="color:#9ca3af;font-weight:400" id="frameTot">/ 1791</span><span class="tag opt-only" style="background:#e6fffb;color:#08979c">帧精确</span></span>
          <span class="cchip"><span class="tag b" id="s1Tag">S1</span><span class="v" id="s1Txt" style="font-size:15px">0 → 300 (300f)</span></span>
          <span class="tr">
            <button id="bFirst">⏮</button><button id="bPrev">‹</button>
            <button class="play" id="bPlay">▶</button>
            <button id="bNext">›</button><button id="bLast">⏭</button>
          </span>
          <span class="sel-w" id="speedWrap" style="position:relative"><select id="speed"></select></span>
          <button class="mini-btn opt-only" id="btnLoop" style="position:relative" title="L">⟲ 循环所选</button>
          <button class="mini-btn opt-only" id="btnKeys" style="position:relative">⌨ 快捷键</button>
          <button class="mini-btn opt-only" id="btnComment" style="position:relative">🚩 批注当前帧</button>
        </div>
      </div>
    </section>

    <aside class="right">
      <div class="rtab">标注</div>
      <div class="rbody">
        <div class="lbl">步骤帧区间调整：</div>
        <div class="big2">
          <button class="bigbtn b" id="btnStart"><span id="bsTxt">开始</span></button>
          <button class="bigbtn o" id="btnEnd"><span id="beTxt">标记</span></button>
        </div>
        <div class="shead"><span>动作模板步骤（<span id="stepCount">2</span>）</span>
          <span class="acts"><button class="obtn">☑ 批量复制</button><button class="sbtn" id="btnAdd">＋ 增加步骤</button></span></div>
        <div class="tplrow opt-only" id="tplRow"><select id="tplSel"><option value="shelf">模板：货架抓取（抓取→放置→复位）</option><option value="pick">模板：单手抓取放置（右手）</option></select><button class="obtn" id="btnTplApply">套用到空白段</button></div>
        <div id="cards"></div>
        <datalist id="objList"><option>安慕希</option><option>可乐</option><option>矿泉水</option><option>薯片</option><option>盒装零食</option></datalist>
      </div>
      <div class="rfoot">
        <div class="flow opt-only" id="flowRow"><span id="qInfo">队列 3 / 20</span><button class="mini-btn" id="btnPrevT">‹ 上一条</button><button class="mini-btn" id="btnNextUn">跳到下一条未标注</button><button class="mini-btn on" id="btnNextT">保存并下一条 ›</button></div>
        <button class="fbtn ghost" id="btnTpl">生成标注模版</button>
        <button class="fbtn main" id="btnDone">完成标注</button>
      </div>
    </aside>
  </div>
</div>

<aside class="drawer" id="drawer">
  <header><b>优化清单</b><button class="mini-btn" id="dClose">关闭</button></header>
  <div class="flt" id="flt"><button class="mini-btn on" data-f="all">全部</button><button class="mini-btn" data-f="P0">P0</button><button class="mini-btn" data-f="P1">P1</button><button class="mini-btn" data-f="P2">P2</button><button class="mini-btn" data-f="new">本轮新增 14</button></div>
  <div class="dlist" id="dlist"></div>
</aside>
<div class="pop" id="pop"></div>
<div class="toast" id="toast"></div>
<div class="tip" id="tip"></div>
<div class="ctx" id="ctx"></div>
<div class="modal-bg" id="modalBg"><div class="modal" id="modal"></div></div>
