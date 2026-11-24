/* Прогресс ученика: сохранение в браузере, «код прогресса» для переноса на другое устройство
   и для учителя. В коде нет паролей и почты: только id пройденных шагов и необязательное имя. */
(function(){
  var P = "pyk1:";
  var GROUPS = {d:"done:", c:"clean:", b:"bug:", p:"pars:", o:"own:", l:"lvl:", a:"ach:", f:"fin:"};
  function ls(){ try { return window.localStorage; } catch(e){ return null; } }
  function get(k){ var s = ls(); try { return s ? s.getItem(P+k) : null; } catch(e){ return null; } }
  function set(k,v){ var s = ls(); try { if (s) s.setItem(P+k, v); } catch(e){} }
  function snapshot(){
    var o = {}, s = ls();
    if (!s) return o;
    for (var i = 0; i < s.length; i++){
      var k = s.key(i);
      if (!k || k.indexOf(P) !== 0) continue;
      k = k.slice(P.length);
      for (var g in GROUPS){
        if (k.indexOf(GROUPS[g]) === 0 && get(k) === "1"){ (o[g] = o[g] || []).push(k.slice(GROUPS[g].length)); }
      }
    }
    return o;
  }
  function b64(s){ return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
  function unb64(s){ s = s.replace(/-/g,"+").replace(/_/g,"/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function encode(){
    var o = snapshot();
    o.n = (get("name") || "").slice(0,60);
    o.t = Date.now();
    return "PYK1." + b64(JSON.stringify(o));
  }
  function decode(code){
    code = String(code || "").trim();
    if (code.indexOf("PYK1.") !== 0) return null;
    try {
      var o = JSON.parse(unb64(code.slice(5)));
      return (o && typeof o === "object") ? o : null;
    } catch(e){ return null; }
  }
  function apply(o){
    for (var g in GROUPS){
      (o[g] || []).forEach(function(id){ if (/^[\w.\-]{1,40}$/.test(String(id))) set(GROUPS[g] + id, "1"); });
    }
    if (o.n && !get("name")) set("name", String(o.n).slice(0,60));
  }
  /* сколько шагов пройдено в модуле: ids — набор id шагов из snapshot().d */
  function courseStats(course, done){
    var total = 0, n = 0;
    course.levels.forEach(function(L){ L.steps.forEach(function(s){ total++; if (done.indexOf(s.id) >= 0) n++; }); });
    return {done:n, total:total};
  }
  window.PYK = {get:get, set:set, snapshot:snapshot, encode:encode, decode:decode, apply:apply, courseStats:courseStats};
})();
