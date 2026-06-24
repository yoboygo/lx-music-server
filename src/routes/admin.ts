import { Hono } from 'hono'

const app = new Hono<{ Bindings: LX.Env }>()

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LX Music Server</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f0f2f5;color:#333;min-height:100vh}
.header{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
.header h1{font-size:17px;font-weight:600}
.header .right{display:flex;align-items:center;gap:12px}
.user-badge{font-size:12px;background:rgba(255,255,255,.15);padding:4px 10px;border-radius:12px}
.btn-logout{background:none;border:1px solid rgba(255,255,255,.3);color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;cursor:pointer}
.btn-logout:hover{background:rgba(255,255,255,.15)}
.container{max-width:960px;margin:0 auto;padding:20px 16px}
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 56px)}
.login-box{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:40px 36px;width:380px;max-width:100%}
.login-box h2{font-size:20px;font-weight:600;text-align:center;margin-bottom:6px}
.login-box p{font-size:13px;color:#999;text-align:center;margin-bottom:24px}
.login-field{margin-bottom:16px}
.login-field label{display:block;font-size:13px;color:#666;margin-bottom:6px}
.login-field input{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none;background:#fff}
.login-field input:focus{border-color:#1a1a2e}
.login-err{color:#e74c3c;font-size:13px;text-align:center;margin-bottom:14px;min-height:18px}
.login-btn{width:100%;padding:10px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer}
.login-btn:hover{opacity:.9}
.tabs{display:flex;margin-bottom:16px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.tab{flex:1;padding:11px 0;text-align:center;cursor:pointer;font-size:14px;font-weight:500;border:none;background:#fff;color:#888;border-bottom:2px solid transparent}
.tab.active{color:#1a1a2e;border-bottom-color:#1a1a2e;background:#fafbff}
.tab:hover:not(.active){color:#555;background:#fafafa}
.panel{display:none}.panel.active{display:block}
.card{background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;margin-bottom:14px}
.card-header{padding:14px 18px;font-weight:600;font-size:14px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
.badge{font-size:11px;font-weight:500;color:#666;background:#f0f0f0;padding:2px 8px;border-radius:10px}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 14px;font-size:12px;color:#999;font-weight:500;border-bottom:1px solid #f0f0f0;background:#fafafa}
td{padding:10px 14px;font-size:13px;border-bottom:1px solid #f5f5f5}
tr:last-child td{border-bottom:none}
.btn{padding:5px 12px;border-radius:5px;border:none;cursor:pointer;font-size:12px;font-weight:500}
.btn-danger{background:#fee;color:#e74c3c}.btn-danger:hover{background:#e74c3c;color:#fff}
.btn-sm{padding:3px 8px;font-size:11px}
.source{display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:500}
.source-kw{background:#e8f5e9;color:#2e7d32}
.source-tx{background:#e3f2fd;color:#1565c0}
.source-wy{background:#fce4ec;color:#c62828}
.source-kg{background:#fff3e0;color:#e65100}
.source-mg{background:#f3e5f5;color:#6a1b9a}
.source-local{background:#eceff1;color:#455a64}
.empty{padding:40px;text-align:center;color:#bbb;font-size:13px}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .3s;z-index:999;pointer-events:none}
.toast.show{opacity:1}
.toast.err{background:#e74c3c}
.modal-mask{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:100;display:none;align-items:center;justify-content:center}
.modal-mask.show{display:flex}
.modal{background:#fff;border-radius:10px;padding:28px 28px 20px;width:340px;max-width:90vw;box-shadow:0 8px 30px rgba(0,0,0,.15)}
.modal h3{font-size:16px;font-weight:600;margin-bottom:10px}
.modal p{font-size:13px;color:#666;margin-bottom:20px}
.modal-actions{display:flex;justify-content:flex-end;gap:8px}
.modal-actions .btn{padding:7px 18px;border-radius:5px;font-size:13px}
.modal-cancel{background:#f5f5f5;color:#666}.modal-cancel:hover{background:#eee}
.modal-ok{background:#e74c3c;color:#fff}.modal-ok:hover{opacity:.9}

.pl-layout{display:flex;gap:0;background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;min-height:500px}
.pl-sidebar{width:180px;flex-shrink:0;background:#fafbfc;border-right:1px solid #eee}
.pl-nav-item{padding:14px 18px;font-size:13px;cursor:pointer;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;transition:all .15s;color:#666}
.pl-nav-item:last-child{border-bottom:none}
.pl-nav-item:hover{background:#f0f1ff;color:#333}
.pl-nav-item.active{background:#eef0ff;color:#1a1a2e;font-weight:600;border-right:2px solid #1a1a2e}
.pl-nav-item .cnt{font-size:11px;color:#999;background:#eee;padding:1px 6px;border-radius:8px}
.pl-nav-item.active .cnt{background:#dde0ff;color:#1a1a2e}
.pl-content{flex:1;min-width:0;padding:16px 20px}
.pl-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:12px;min-height:32px}
.pl-toolbar .info{font-size:12px;color:#999;flex:1}
.pl-toolbar .btn{font-size:12px}
.chk{width:16px;height:16px;cursor:pointer;accent-color:#1a1a2e}
.song-tbl{width:100%;border-collapse:collapse}
.song-tbl th{text-align:left;padding:8px 10px;font-size:12px;color:#999;font-weight:500;border-bottom:1px solid #f0f0f0;background:#fafafa}
.song-tbl th:first-child{width:36px;text-align:center}
.song-tbl td{padding:7px 10px;font-size:13px;border-bottom:1px solid #f8f8f8}
.song-tbl td:first-child{text-align:center}
.song-tbl tr:hover{background:#fafbff}
.song-tbl .num{color:#ccc;font-size:12px;min-width:20px}
.song-tbl .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
.song-tbl .singer{color:#999;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}
.song-tbl .dur{color:#bbb;font-size:12px;white-space:nowrap}
.pg{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:14px;font-size:12px}
.pg button{padding:4px 10px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:12px}
.pg button:hover:not(:disabled){background:#f5f5f5}
.pg button:disabled{opacity:.4;cursor:not-allowed}
.pg .cur{padding:4px 10px;font-weight:600;color:#1a1a2e}
.dislike-list{padding:14px 18px}
.dislike-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f8f8f8;font-size:13px}
.dislike-item:last-child{border-bottom:none}
.dislike-item .rule{flex:1;color:#c0392b;background:#fff0f0;padding:3px 10px;border-radius:4px;font-size:12px}
</style>
</head>
<body>
<div class="header">
  <h1>LX Music Server</h1>
  <div class="right" id="headerRight" style="display:none">
    <span class="user-badge" id="userBadge"></span>
    <button class="btn-logout" id="exportBtn">导出数据</button>
    <button class="btn-logout" id="importBtn">导入数据</button>
    <button class="btn-logout" id="logoutBtn">退出登录</button>
  </div>
</div>
<div id="loginView" class="login-wrap">
  <div class="login-box">
    <h2>管理面板</h2>
    <p>请输入用户名和密码登录</p>
    <div class="login-field">
      <label>用户名</label>
      <input type="text" id="userInput" placeholder="用户名" autocomplete="off">
    </div>
    <div class="login-field">
      <label>密码</label>
      <input type="password" id="pwInput" placeholder="密码" autocomplete="off">
    </div>
    <div class="login-err" id="loginErr"></div>
    <button class="login-btn" id="loginBtn">登录</button>
  </div>
</div>
<div id="mainView" class="container" style="display:none">
  <div class="tabs" id="tabsBar">
    <button class="tab active" data-tab="devices">设备管理</button>
    <button class="tab" data-tab="playlists">歌单数据</button>
  </div>
  <div class="panel active" id="panel-devices"></div>
  <div class="panel" id="panel-playlists"></div>
</div>
<div class="toast" id="toast"></div>
<div class="modal-mask" id="modalMask">
  <div class="modal">
    <h3 id="modalTitle"></h3>
    <p id="modalMsg"></p>
    <div class="modal-actions">
      <button class="btn modal-cancel" id="modalCancel">取消</button>
      <button class="btn modal-ok" id="modalOk">确认</button>
    </div>
  </div>
</div>
<script>
var AUTH='';
var plData={lists:[],dislikeRules:'',activeList:'love',page:1,pageSize:50,selected:{}};

function $(id){return document.getElementById(id)}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function toast(m,e){var t=$('toast');t.textContent=m;t.className='toast show'+(e?' err':'');setTimeout(function(){t.className='toast'},2200)}

function api(path,opts){
  opts=opts||{};
  var h=Object.assign({},opts.headers||{});
  h['Authorization']='Basic '+AUTH;
  return fetch(path,Object.assign({},opts,{headers:h}));
}

function doLogin(){
  var u=$('userInput').value.trim();
  var pw=$('pwInput').value.trim();
  if(!u){$('loginErr').textContent='请输入用户名';return}
  if(!pw){$('loginErr').textContent='请输入密码';return}
  $('loginErr').textContent='';
  var cred=btoa(unescape(encodeURIComponent(u+':'+pw)));
  fetch('/api/admin/login',{headers:{'Authorization':'Basic '+cred}}).then(function(r){
    if(!r.ok){$('loginErr').textContent='用户名或密码错误';return}
    AUTH=cred;sessionStorage.setItem('lx_auth',AUTH);sessionStorage.setItem('lx_user',u);showMain();
  }).catch(function(){$('loginErr').textContent='登录失败'});
}

function logout(){
  AUTH='';sessionStorage.removeItem('lx_auth');sessionStorage.removeItem('lx_user');
  $('loginView').style.display='';$('mainView').style.display='none';$('headerRight').style.display='none';
  $('pwInput').value='';$('userInput').value='';$('loginErr').textContent='';
}

function exportData(){
  api('/api/admin/export').then(function(r){return r.json()}).then(function(data){
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='lx-music-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('数据已导出');
  }).catch(function(){toast('导出失败',true)});
}

function importData(){
  var input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result);
        if(!data.listData&&!data.dislikeRules){toast('无效的备份文件',true);return}
        showConfirm('导入数据','导入将覆盖当前所有歌单和不喜欢规则，确认继续？',function(){
          api('/api/admin/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){
            if(!r.ok)throw new Error();toast('数据已导入');loadPlaylists();
          }).catch(function(){toast('导入失败',true)});
        });
      }catch(ex){toast('文件解析失败',true)}
    };
    reader.readAsText(file);
  };
  input.click();
}

function showMain(){
  $('loginView').style.display='none';$('mainView').style.display='';$('headerRight').style.display='';
  $('userBadge').textContent=sessionStorage.getItem('lx_user')||'';loadDevices();
}

function formatTime(ts){if(!ts)return'-';return new Date(ts).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function sourceLabel(s){return{kw:'酷我',tx:'QQ',wy:'网易',kg:'酷狗',mg:'咪咕',local:'本地'}[s]||s}

function loadDevices(){
  var el=$('panel-devices');
  el.innerHTML='<div class="card"><div class="empty">加载中...</div></div>';
  api('/api/admin/devices').then(function(r){return r.json()}).then(function(devices){
    if(!devices.length){el.innerHTML='<div class="card"><div class="empty">暂无已授权设备</div></div>';return}
    var h='<div class="card"><div class="card-header">已授权设备<span class="badge">'+devices.length+'</span></div><table><thead><tr><th>设备名称</th><th>类型</th><th>最后连接</th><th></th></tr></thead><tbody>';
    devices.forEach(function(d){
      h+='<tr><td>'+esc(d.deviceName||'未知')+'</td><td>'+(d.isMobile?'手机':'桌面')+'</td><td>'+formatTime(d.lastConnectDate)+'</td><td><button class="btn btn-danger" data-del="'+esc(d.clientId)+'" data-name="'+esc(d.deviceName||'未知')+'">删除</button></td></tr>';
    });
    h+='</tbody></table></div>';el.innerHTML=h;
  }).catch(function(){el.innerHTML='<div class="card"><div class="empty">加载设备列表失败</div></div>'});
}

function loadPlaylists(){
  var el=$('panel-playlists');
  el.innerHTML='<div class="card"><div class="empty">加载中...</div></div>';
  Promise.all([api('/api/admin/list-data'),api('/api/admin/dislike-data')]).then(function(rs){
    return Promise.all([rs[0].json(),rs[1].json()]);
  }).then(function(pair){
    var ld=pair[0];
    plData.dislikeRules=pair[1]||'';
    plData.lists=[
      {id:'love',name:'我的收藏',songs:ld.loveList||[]},
      {id:'dislike',name:'不喜欢规则',songs:[]},
      {id:'default',name:'试听列表',songs:ld.defaultList||[]}
    ];
    if(ld.userList)ld.userList.forEach(function(ul){plData.lists.push({id:ul.id,name:ul.name,songs:ul.list||[]})});
    plData.selected={};plData.page=1;
    renderPlaylists();
  }).catch(function(){el.innerHTML='<div class="card"><div class="empty">加载歌单数据失败</div></div>'});
}

function renderPlaylists(){
  var el=$('panel-playlists');
  var lists=plData.lists;
  var active=plData.activeList;
  var isDislike=active==='dislike';
  var curList=lists.find(function(l){return l.id===active});
  var songs=isDislike?[]:(curList?curList.songs:[]);
  var total=songs.length;
  var pg=plData.page,ps=plData.pageSize,pages=Math.ceil(total/ps)||1;
  if(pg>pages)pg=plData.page=pages;
  var start=(pg-1)*ps,pageSongs=songs.slice(start,start+ps);
  var sel=plData.selected[active]||[];
  var allChecked=pageSongs.length>0&&pageSongs.every(function(s){return sel.indexOf(s.id)>=0});

  var h='<div class="pl-layout"><div class="pl-sidebar">';
  lists.forEach(function(l){
    var cnt=l.id==='dislike'?(plData.dislikeRules.trim()?plData.dislikeRules.trim().split('\\n').length:0):l.songs.length;
    h+='<div class="pl-nav-item'+(l.id===active?' active':'')+'" data-nav="'+l.id+'"><span>'+esc(l.name)+'</span><span class="cnt">'+cnt+'</span></div>';
  });
  h+='</div><div class="pl-content">';

  if(isDislike){
    var drSel=plData.selected[active]||[];
    var rules=plData.dislikeRules.trim()?plData.dislikeRules.trim().split('\\n').filter(function(l){return l.trim()}):[];
    h+='<div class="pl-toolbar">';
    h+='<input type="checkbox" class="chk" id="checkAllDislike"'+(rules.length>0&&rules.every(function(_,i){return drSel.indexOf(String(i))>=0})?' checked':'')+'>';
    h+='<span class="info">共 '+rules.length+' 条规则</span>';
    h+='<button class="btn btn-danger" id="delSelDislike" style="display:'+(drSel.length?'':'none')+'">删除选中 ('+drSel.length+')</button>';
    h+='</div>';
    h+='<div class="dislike-list">';
    rules.forEach(function(r,i){
        var drChecked=drSel.indexOf(String(i))>=0;
        h+='<div class="dislike-item"><input type="checkbox" class="chk" data-dr="'+i+'"'+(drChecked?' checked':'')+'><span class="rule">'+esc(r)+'</span><button class="btn btn-danger btn-sm" data-drdel="'+i+'">删除</button></div>';
      });
      h+='</div>';
  }else{
    h+='<div class="pl-toolbar">';
    h+='<input type="checkbox" class="chk" id="checkAll"'+(allChecked?' checked':'')+'>';
    h+='<span class="info">共 '+total+' 首，第 '+pg+'/'+pages+' 页</span>';
    h+='<button class="btn btn-danger" id="delSelBtn" style="display:'+(sel.length?'':'none')+'">删除选中 ('+sel.length+')</button>';
    h+='</div>';
    if(!total)h+='<div class="empty">空列表</div>';
    else{
      h+='<table class="song-tbl"><thead><tr><th></th><th>#</th><th>歌曲</th><th>歌手</th><th>来源</th><th>时长</th></tr></thead><tbody>';
      pageSongs.forEach(function(s,i){
        var checked=sel.indexOf(s.id)>=0;
        h+='<tr><td><input type="checkbox" class="chk" data-sid="'+esc(s.id)+'"'+(checked?' checked':'')+'></td><td class="num">'+(start+i+1)+'</td><td class="name" title="'+esc(s.name)+'">'+esc(s.name)+'</td><td class="singer" title="'+esc(s.singer)+'">'+esc(s.singer)+'</td><td><span class="source source-'+s.source+'">'+sourceLabel(s.source)+'</span></td><td class="dur">'+(s.interval||'')+'</td></tr>';
      });
      h+='</tbody></table>';
      if(pages>1){
        h+='<div class="pg"><button data-pg="prev"'+(pg<=1?' disabled':'')+'>上一页</button>';
        for(var i=1;i<=pages;i++){
          if(pages>7&&i>2&&i<pages-1&&Math.abs(i-pg)>1){if(i===3||i===pages-2)h+='<span>...</span>';continue}
          h+='<button data-pg="'+i+'"'+(i===pg?' class="cur"':'')+'>'+i+'</button>';
        }
        h+='<button data-pg="next"'+(pg>=pages?' disabled':'')+'>下一页</button></div>';
      }
    }
  }
  h+='</div></div>';
  el.innerHTML=h;
}

var pendingAction=null;
function showConfirm(title,msg,cb){
  pendingAction=cb;
  $('modalTitle').textContent=title;$('modalMsg').textContent=msg;$('modalMask').classList.add('show');
}
function closeModal(){$('modalMask').classList.remove('show');pendingAction=null}

document.addEventListener('click',function(e){
  var t=e.target;
  if(t.id==='loginBtn'){doLogin();return}
  if(t.id==='logoutBtn'){logout();return}
  if(t.id==='exportBtn'){exportData();return}
  if(t.id==='importBtn'){importData();return}
  if(t.id==='modalCancel'){closeModal();return}
  if(t.id==='modalOk'){
    if(pendingAction){var cb=pendingAction;closeModal();cb();}
    return;
  }
  if(t.dataset&&t.dataset.del){showConfirm('删除设备','确认删除设备 "'+t.dataset.name+'" 吗？该设备需要重新认证才能连接。',function(){
    api('/api/admin/devices/'+encodeURIComponent(t.dataset.del),{method:'DELETE'}).then(function(r){
      if(!r.ok)throw new Error();toast('设备已删除');loadDevices();
    }).catch(function(){toast('删除失败',true)});
  });return}

  var nav=t.closest('.pl-nav-item');
  if(nav){plData.activeList=nav.dataset.nav;plData.page=1;plData.selected[plData.activeList]=[];renderPlaylists();return}

  var tab=t.closest('.tab');
  if(tab){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active')});
    document.querySelectorAll('.panel').forEach(function(x){x.classList.remove('active')});
    tab.classList.add('active');
    var p=document.getElementById('panel-'+tab.dataset.tab);
    if(p)p.classList.add('active');
    if(tab.dataset.tab==='devices')loadDevices();else loadPlaylists();
    return;
  }
});

document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='checkAll'){
    var active=plData.activeList;
    var curList=plData.lists.find(function(l){return l.id===active});
    if(!curList)return;
    plData.selected[active]=t.checked?curList.songs.map(function(s){return s.id}):[];
    renderPlaylists();return;
  }
  if(t.id==='checkAllDislike'){
    var active=plData.activeList;
    var lines=plData.dislikeRules.trim()?plData.dislikeRules.trim().split('\\n').filter(function(l){return l.trim()}):[];
    plData.selected[active]=t.checked?lines.map(function(_,i){return String(i)}):[];
    renderPlaylists();return;
  }
  if(t.dataset&&t.dataset.sid){
    var active=plData.activeList;
    if(!plData.selected[active])plData.selected[active]=[];
    var sel=plData.selected[active];
    var idx=sel.indexOf(t.dataset.sid);
    if(t.checked&&idx<0)sel.push(t.dataset.sid);
    if(!t.checked&&idx>=0)sel.splice(idx,1);
    renderPlaylists();return;
  }
  if(t.dataset&&t.dataset.dr!==undefined){
    var active=plData.activeList;
    if(!plData.selected[active])plData.selected[active]=[];
    var sel=plData.selected[active];
    var idx=sel.indexOf(t.dataset.dr);
    if(t.checked&&idx<0)sel.push(t.dataset.dr);
    if(!t.checked&&idx>=0)sel.splice(idx,1);
    var delBtn=document.getElementById('delSelDislike');
    if(delBtn)delBtn.style.display=sel.length?'':'none';
    return;
  }
});

document.addEventListener('click',function(e){
  var t=e.target;

  if(t.id==='delSelBtn'){
    var active=plData.activeList;
    var sel=plData.selected[active]||[];
    if(!sel.length)return;
    var curList=plData.lists.find(function(l){return l.id===active});
    showConfirm('删除歌曲','确认从 "'+curList.name+'" 中删除选中的 '+sel.length+' 首歌曲吗？',function(){
      api('/api/admin/list-music/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listId:active,musicIds:sel})}).then(function(r){
        if(!r.ok)throw new Error();toast('已删除 '+sel.length+' 首歌曲');plData.selected[active]=[];loadPlaylists();
      }).catch(function(){toast('删除失败',true)});
    });return;
  }

  if(t.id==='delSelDislike'){
    var active=plData.activeList;
    var sel=plData.selected[active]||[];
    if(!sel.length)return;
    var lines=plData.dislikeRules.trim().split('\\n').filter(function(l){return l.trim()});
    var newLines=lines.filter(function(_,i){return sel.indexOf(String(i))<0});
    showConfirm('删除规则','确认删除选中的 '+sel.length+' 条不喜欢规则吗？',function(){
      api('/api/admin/dislike-music/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:newLines.join('\\n')})}).then(function(r){
        if(!r.ok)throw new Error();toast('已删除 '+sel.length+' 条规则');plData.selected[active]=[];loadPlaylists();
      }).catch(function(){toast('删除失败',true)});
    });return;
  }

  if(t.dataset&&t.dataset.drdel!==undefined){
    var lines=plData.dislikeRules.trim().split('\\n').filter(function(l){return l.trim()});
    var idx=parseInt(t.dataset.drdel);
    var rule=lines[idx];
    showConfirm('删除规则','确认删除规则 "'+rule+'" 吗？',function(){
      lines.splice(idx,1);
      api('/api/admin/dislike-music/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:lines.join('\\n')})}).then(function(r){
        if(!r.ok)throw new Error();toast('规则已删除');loadPlaylists();
      }).catch(function(){toast('删除失败',true)});
    });return;
  }

  var pgBtn=t.closest('[data-pg]');
  if(pgBtn&&pgBtn.dataset.pg){
    var pg=pgBtn.dataset.pg;
    if(pg==='prev')plData.page--;
    else if(pg==='next')plData.page++;
    else plData.page=parseInt(pg);
    renderPlaylists();return;
  }
});

$('pwInput').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
$('userInput').addEventListener('keydown',function(e){if(e.key==='Enter')$('pwInput').focus()});
$('modalMask').addEventListener('click',function(e){if(e.target===e.currentTarget)closeModal()});

(function(){
  var saved=sessionStorage.getItem('lx_auth');
  if(saved){AUTH=saved;showMain()}
})();
</script>
</body>
</html>`;

app.get('/admin', async(c) => {
  return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } })
})

app.get('/api/admin/login', async(c) => {
  const authHeader = c.req.raw.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) return c.text('Unauthorized', 401)
  const creds = decodeBasicAuth(authHeader.slice(6))
  if (!creds) return c.text('Unauthorized', 401)
  const [username, password] = creds
  const users: LX.User[] = JSON.parse(c.env.LX_USERS || '[]')
  const user = users.find(u => u.name === username && u.password === password)
  if (!user) return c.text('Unauthorized', 401)
  return c.json({ user: user.name })
})

function decodeBasicAuth(b64: string): [string, string] | null {
  try {
    const raw = atob(b64)
    const decoded = decodeURIComponent(escape(raw))
    const sep = decoded.indexOf(':')
    if (sep === -1) return null
    return [decoded.slice(0, sep), decoded.slice(sep + 1)]
  } catch { return null }
}

const checkAuth = async(c: { req: { raw: Request }; env: LX.Env }): Promise<string | null> => {
  const authHeader = c.req.raw.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) return null
  const creds = decodeBasicAuth(authHeader.slice(6))
  if (!creds) return null
  const [username, password] = creds
  const users: LX.User[] = JSON.parse(c.env.LX_USERS || '[]')
  const user = users.find(u => u.name === username && u.password === password)
  return user ? user.name : null
}

app.get('/api/admin/devices', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/devices')
  return new Response(resp.body, { headers: { 'content-type': 'application/json' } })
})

app.delete('/api/admin/devices/:clientId', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const clientId = c.req.param('clientId')
  await c.env.KV.delete(`client:${clientId}`)
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch(`https://do/devices/${encodeURIComponent(clientId)}`, { method: 'DELETE' })
  return new Response(null, { status: resp.status })
})

app.get('/api/admin/list-data', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/list-data')
  return new Response(resp.body, { headers: { 'content-type': 'application/json' } })
})

app.get('/api/admin/dislike-data', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/dislike-data')
  return new Response(resp.body, { headers: { 'content-type': 'application/json' } })
})

app.post('/api/admin/list-music/delete', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const body = await c.req.text()
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/list-music/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
  return new Response(null, { status: resp.status })
})

app.post('/api/admin/dislike-music/delete', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const body = await c.req.text()
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/dislike-music/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
  return new Response(null, { status: resp.status })
})

app.get('/api/admin/export', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/export-data')
  return new Response(resp.body, { headers: { 'content-type': 'application/json' } })
})

app.post('/api/admin/import', async(c) => {
  const userName = await checkAuth(c)
  if (!userName) return c.text('Unauthorized', 401)
  const body = await c.req.text()
  const doId = c.env.USER_SYNC.idFromName(userName)
  const doStub = c.env.USER_SYNC.get(doId)
  const resp = await doStub.fetch('https://do/import-data', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
  return new Response(null, { status: resp.status })
})

export default app
