/* Общий движок тренажёра: помощник Оркен, запуск Python (Skulpt), проверка шагов,
   достижения, связь с сайтом. Данные берёт из window.COURSE (см. courses/*.js). */
(function(){
"use strict";

/* ---------- Помощник Оркен ---------- */
var POSES = window.POSES || null;
var COURSE = window.COURSE;
var LEVELS = COURSE.levels;
var KEYP = "pyk1:";
var EMBED = (function(){ try { return window.parent !== window; } catch(e){ return true; } })();
var PRAISE = ["Верно!","Отлично!","Так держать!","Чисто сработано!","Есть!","Здорово получилось!"];
var RETRY = ["Почти. Давай ещё раз.","Не страшно, ошибки — часть пути.","Загляни в подсказку, она рядом.","Проверь ещё раз, ты близко."];
var START = {run:"Нажми ▶ и посмотри, что получится.", edit:"Попробуй сам. Подсказка рядом, если понадобится.", quiz:"Подумай, потом проверь запуском.", parsons:"Расставь строки по порядку."};
var ACH = [
  {id:"first_run", icon:"🚀", name:"Первый запуск", desc:"Запустил первую программу"},
  {id:"bugs", icon:"🐞", name:"Охотник за ошибками", desc:"Исправил 3 ошибки"},
  {id:"clean", icon:"💪", name:"Самостоятельный", desc:"3 шага без подсказок и промахов"},
  {id:"level", icon:"🏅", name:"Мастер уровня", desc:"Прошёл целый уровень"},
  {id:"parsons", icon:"🧩", name:"Собери сам", desc:"Собрал программу из строк"},
  {id:"own", icon:"✍️", name:"Свой код", desc:"Написал свою программу"},
  {id:"cond", icon:"🔀", name:"Развилка", desc:"Написал свой if"},
  {id:"loop", icon:"🔁", name:"Повторяльщик", desc:"Написал цикл"},
  {id:"game", icon:"🎮", name:"Геймдизайнер", desc:"Собрал свою игру"}
];

/* ---------- Подсистема ---------- */
var LS = {
  get:function(k){try{return localStorage.getItem(KEYP+k);}catch(e){return null;}},
  set:function(k,v){try{localStorage.setItem(KEYP+k,v);}catch(e){}},
  del:function(k){try{localStorage.removeItem(KEYP+k);}catch(e){}}
};
function $(id){ return document.getElementById(id); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

var ta = $("code"), gutter = $("gutter"), cons = $("console"), codeWrap = $("codeWrap"), parsonsEl = $("parsons");
var btnRun = $("btnRun"), btnStop = $("btnStop"), btnReset = $("btnReset");
var li = 0, si = 0;
var current = null;
var ranOk = false, ranErr = false;
var badLine = null;
var order = [];
var fails = {}, hints = {};
var lastField = ta;

function stepOf(a,b){ return LEVELS[a].steps[b]; }
function isDone(st){ return LS.get("done:"+st.id) === "1"; }
function levelDone(l){ return l.steps.every(isDone); }

function say(pose, text){
  var img = $("helperImg");
  if (POSES && POSES[pose]) img.src = POSES[pose];
  $("helperText").textContent = text || "";
}
function toast(msg){
  var t = $("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.tm);
  toast.tm = setTimeout(function(){ t.hidden = true; }, 4200);
}

/* ---------- Связь с сайтом (протокол тренажёров v1) ---------- */
function send(msg){
  if (!EMBED) return;
  msg.v = 1;
  try { window.parent.postMessage(msg, "*"); } catch(e){}
}
function sharing(){ return LS.get("share") === "1"; }
function courseDone(){ return LEVELS.every(levelDone); }
/* оценка шага: 3 — сам, 2 — с подсказкой или одной ошибкой, 1 — нужна была помощь */
function stepScore(id){
  var n = (fails[id] || 0) + (hints[id] || 0);
  return n === 0 ? 3 : (n <= 2 ? 2 : 1);
}
function report(st){
  if (!sharing()) return;
  send({type:"trainer:result", lesson: (COURSE.id + "/" + st.id).slice(0,80), score: stepScore(st.id), max: 3});
  if (courseDone() && LS.get("fin:"+COURSE.id) !== "1"){ LS.set("fin:"+COURSE.id, "1"); send({type:"trainer:finish"}); }
}
function renderShare(){
  var b = $("btnShare"), on = sharing();
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.textContent = "📤 Учителю: " + (on ? "вкл" : "выкл");
  b.title = on ? "Результаты шагов отправляются учителю. Нажми, чтобы выключить." : "Нажми, чтобы отправлять результаты шагов учителю.";
}
var hTimer = null;
function postHeight(){
  if (!EMBED) return;
  cancelAnimationFrame(hTimer);
  hTimer = requestAnimationFrame(function(){ send({type:"trainer:height", height: Math.ceil(document.body.offsetHeight)}); });
}

/* ---------- Достижения ---------- */
function achOn(id){ return LS.get("ach:"+id) === "1"; }
function renderAch(){
  var n = 0, box = $("achList");
  box.innerHTML = "";
  ACH.forEach(function(a){
    var on = achOn(a.id); if (on) n++;
    var row = document.createElement("div"); row.className = "achi" + (on ? " on" : "");
    row.innerHTML = '<div class="ic"></div><div><b></b><small></small></div>';
    row.querySelector(".ic").textContent = a.icon;
    row.querySelector("b").textContent = a.name;
    row.querySelector("small").textContent = a.desc;
    box.appendChild(row);
  });
  $("achCount").textContent = n + "/" + ACH.length;
}
function unlock(id, newList){
  if (achOn(id)) return;
  LS.set("ach:"+id, "1");
  newList.push(ACH.filter(function(a){ return a.id === id; })[0]);
}
function countKeys(prefix){
  var n = 0;
  try { for (var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if (k && k.indexOf(KEYP + prefix) === 0) n++; } } catch(e){}
  return n;
}
function checkAch(extra){
  var fresh = [];
  function doneId(id){ return LS.get("done:"+id) === "1"; }
  if (extra && extra.firstRun) unlock("first_run", fresh);
  if (countKeys("bug:") >= 3) unlock("bugs", fresh);
  if (countKeys("clean:") >= 3) unlock("clean", fresh);
  if (countKeys("lvl:") >= 1) unlock("level", fresh);
  if (countKeys("pars:") >= 1) unlock("parsons", fresh);
  if (countKeys("own:") >= 1) unlock("own", fresh);
  if (doneId("6-5") || doneId("8-5")) unlock("cond", fresh);
  if (doneId("11-5") || doneId("12-3")) unlock("loop", fresh);
  if (doneId("13-4")) unlock("game", fresh);
  renderAch();
  if (fresh.length){
    var names = fresh.map(function(a){ return a.icon + " " + a.name; }).join(", ");
    toast("Новое достижение: " + names);
  }
  return fresh;
}
$("btnAch").addEventListener("click", function(){
  var p = $("achPanel");
  p.hidden = !p.hidden;
  $("btnAch").setAttribute("aria-expanded", p.hidden ? "false" : "true");
});

function builtinRead(x){
  if (typeof Sk.builtinFiles === "undefined" || typeof Sk.builtinFiles.files[x] === "undefined") throw "Файл не найден: '" + x + "'";
  return Sk.builtinFiles.files[x];
}

/* ---------- Консоль ---------- */
function clearCons(){ cons.innerHTML = ""; }
function out(text, cls){
  var s = document.createElement("span");
  if (cls) s.className = cls;
  s.textContent = text;
  cons.appendChild(s);
  cons.scrollTop = cons.scrollHeight;
}
function placeholder(){ clearCons(); out("Нажми «▶ Запустить» — здесь появится результат.", "sys"); }
function ask(prompt, ctx){
  return new Promise(function(resolve, reject){
    if (prompt) out(String(prompt));
    var inp = document.createElement("input");
    inp.type = "text"; inp.autocomplete = "off";
    inp.setAttribute("aria-label", "Твой ответ");
    cons.appendChild(inp);
    cons.scrollTop = cons.scrollHeight;
    try { inp.focus({preventScroll:true}); } catch(e){ inp.focus(); }
    lastField = inp;
    ctx.rejectInput = function(err){ inp.disabled = true; reject(err); };
    inp.addEventListener("keydown", function(ev){
      if (ev.key === "Enter" && !ev.isComposing){
        ev.preventDefault();
        var v = inp.value;
        var echo = document.createElement("span");
        echo.className = "echo"; echo.textContent = v + "\n";
        inp.replaceWith(echo);
        ctx.rejectInput = null;
        try { Sk.execStart = Date.now(); } catch(e){}
        resolve(v);
      }
    });
  });
}

/* ---------- Редактор ---------- */
function renderGutter(){
  var n = ta.value.split("\n").length, h = "";
  for (var i=1;i<=n;i++){
    h += (i===badLine ? '<span class="bad">'+i+'</span>' : String(i)) + (i<n ? "\n" : "");
  }
  gutter.innerHTML = h;
  ta.style.height = "auto";
  ta.style.height = Math.max(140, ta.scrollHeight) + "px";
}
function insertAt(el, t){
  var s = el.selectionStart, e = el.selectionEnd;
  el.setRangeText(t, s, e, "end");
  el.dispatchEvent(new Event("input", {bubbles:true}));
}
ta.addEventListener("keydown", function(e){
  if (ta.readOnly) return;
  if (e.key === "Tab" && !e.shiftKey){ e.preventDefault(); insertAt(ta, "    "); }
  else if (e.key === "Enter" && !e.isComposing && !e.shiftKey){
    var before = ta.value.slice(0, ta.selectionStart);
    var line = before.slice(before.lastIndexOf("\n")+1);
    var ind = (line.match(/^ */)||[""])[0];
    if (/:\s*$/.test(line)) ind += "    ";
    e.preventDefault();
    insertAt(ta, "\n" + ind);
  }
});
ta.addEventListener("input", function(){
  badLine = null;
  renderGutter();
  var st = stepOf(li, si);
  if (st.type === "edit") LS.set("code:"+st.id, ta.value);
});
document.addEventListener("focusin", function(e){
  if (e.target === ta || (e.target.tagName === "INPUT" && cons.contains(e.target))) lastField = e.target;
});

/* ---------- Запуск ---------- */
function hintFor(type, text){
  if (/IndentationError/.test(type) || /indent/i.test(text))
    return "Проверь отступы: строки внутри блока начинаются с одинакового числа пробелов.";
  if (/SyntaxError/.test(type)){
    if (/EOF|EOL|string/i.test(text)) return "Похоже, не закрыты кавычки или скобка. Посмотри на эту строку и строку перед ней.";
    return "Проверь эту строку и строку перед ней: закрыты ли кавычки и скобки, нет ли лишних символов.";
  }
  if (/NameError/.test(type))
    return "Python не знает такого слова. Проверь опечатки: команда print пишется маленькими буквами, а переменная должна быть создана выше.";
  if (/TypeError/.test(type))
    return "Похоже, текст и число склеиваются через «+». В print лучше перечислять через запятую.";
  if (/TimeoutError/.test(type)) return "Программа работала слишком долго. Запусти её ещё раз.";
  return "Прочитай строку с ошибкой и сравни её с примером из подсказки.";
}
function showError(err, quiet){
  var text = "";
  try { text = (err && err.toString) ? err.toString() : String(err); } catch(e){ text = String(err); }
  var line = null;
  try { if (err && err.traceback && err.traceback.length) line = err.traceback[0].lineno; } catch(e){}
  if (!line){ var m = text.match(/line (\d+)/); if (m) line = parseInt(m[1],10); }
  var type = (err && err.tp$name) ? err.tp$name : text.split(":")[0];
  out("\nОшибка" + (line ? " в строке " + line : "") + ": " + text + "\n", "err");
  out("Подсказка: " + hintFor(type, text) + "\n", "hint");
  var st = stepOf(li, si);
  if (line && st.type !== "parsons"){ badLine = line; renderGutter(); }
  if (!quiet) say("think", "Ошибка — это подсказка." + (line ? " Смотри строку " + line + "." : ""));
}
function skReady(){ return !(window.skFail || !window.Sk || !Sk.builtinFiles); }
function setBusy(b){ btnStop.disabled = !b; }
function stopRun(){
  if (!current) return;
  var c = current;
  c.stopped = true;
  if (c.rejectInput) c.rejectInput(new Error("stopped"));
  current = null;
  setBusy(false);
  out("\n— Остановлено —\n", "sys");
}
function getCode(){
  var st = stepOf(li, si);
  return st.type === "parsons" ? assemble(st, order) : ta.value;
}
function run(){
  if (!skReady()){
    clearCons();
    out("Python не загрузился. Проверь интернет или доступ к cdn.jsdelivr.net в школьной сети и обнови страницу.\n", "err");
    return;
  }
  if (current) stopRun();
  clearCons(); badLine = null; renderGutter();
  var ctx = {stopped:false, rejectInput:null};
  current = ctx; setBusy(true);
  var code = getCode();
  Sk.configure({
    output: function(t){ if (ctx.stopped) return; ctx.n = (ctx.n || 0) + t.length; if (ctx.n > 6000){ ctx.flood = true; throw new Error("flood"); } out(t); },
    read: builtinRead,
    inputfun: function(p){ return ask(p, ctx); },
    inputfunTakesPrompt: true,
    __future__: Sk.python3,
    execLimit: 10000
  });
  try { Sk.execStart = Date.now(); } catch(e){}
  Sk.misceval.asyncToPromise(function(){
    return Sk.importMainWithBody("<stdin>", false, code, true);
  }).then(function(){
    if (!ctx.stopped){
      out("\n— Программа завершена —\n", "sys");
      ranOk = true;
      var first = LS.get("ach:first_run") !== "1";
      checkAch({firstRun:true});
      if (first) say("joy", "Твоя первая программа запущена!");
    }
  }, function(err){
    if (!ctx.stopped){
      ranErr = true;
      if (ctx.flood){
        out("\n— Слишком много строк. Похоже, цикл не заканчивается: проверь, меняется ли число внутри цикла. —\n", "err");
        say("think", "Похоже, цикл не заканчивается. Меняется ли число внутри цикла?");
      } else showError(err);
    }
  }).then(function(){
    if (current === ctx){ current = null; setBusy(false); }
  });
}
function runSilent(code, inputs){
  return new Promise(function(resolve){
    var o = "", k = 0;
    Sk.configure({
      output: function(t){ o += t; if (o.length > 4000) throw new Error("flood"); },
      read: builtinRead,
      inputfun: function(){ var v = k < inputs.length ? inputs[k] : ""; k++; return v; },
      inputfunTakesPrompt: true,
      __future__: Sk.python3,
      execLimit: 5000
    });
    try { Sk.execStart = Date.now(); } catch(e){}
    Sk.misceval.asyncToPromise(function(){
      return Sk.importMainWithBody("<stdin>", false, code, true);
    }).then(function(){ resolve({ok:true, out:o}); },
            function(err){ resolve({ok:false, out:o, err:err}); });
  });
}

/* ---------- Сборка программы из строк ---------- */
function renderParsons(){
  var st = stepOf(li, si);
  parsonsEl.innerHTML = "";
  order.forEach(function(idx, p){
    var row = document.createElement("div"); row.className = "prow";
    var code = document.createElement("div"); code.className = "pcode"; code.textContent = st.lines[idx];
    var up = document.createElement("button"); up.type = "button"; up.className = "mv"; up.textContent = "▲";
    up.setAttribute("aria-label", "Поднять строку"); up.disabled = (p === 0);
    var dn = document.createElement("button"); dn.type = "button"; dn.className = "mv"; dn.textContent = "▼";
    dn.setAttribute("aria-label", "Опустить строку"); dn.disabled = (p === order.length-1);
    up.addEventListener("click", function(){ moveRow(p, p-1); });
    dn.addEventListener("click", function(){ moveRow(p, p+1); });
    row.appendChild(code); row.appendChild(up); row.appendChild(dn);
    parsonsEl.appendChild(row);
  });
}
function moveRow(a, b){
  if (b < 0 || b >= order.length) return;
  var t = order[a]; order[a] = order[b]; order[b] = t;
  LS.set("ord:"+stepOf(li, si).id, order.join(","));
  renderParsons();
}

/* ---------- Шаг ---------- */
function setFeedback(kind, html){
  postHeight();
  var f = $("feedback");
  f.innerHTML = html ? '<div class="fb ' + kind + '">' + html + '</div>' : "";
}
function initialOrder(st){
  var saved = LS.get("ord:"+st.id);
  if (saved){
    var arr = saved.split(",").map(Number);
    if (arr.length === st.lines.length) return arr;
  }
  return st.order.slice();
}
function startCode(st){
  var saved = LS.get("code:"+st.id);
  if (saved !== null) return saved;
  return st.starter || "";
}
function setIdeMode(st){
  var parsons = st.type === "parsons";
  codeWrap.hidden = parsons;
  parsonsEl.hidden = !parsons;
  var sn = $("snips");
  sn.innerHTML = "";
  if (st.snippets && st.snippets.length){
    sn.hidden = false;
    st.snippets.forEach(function(s){
      var b = document.createElement("button");
      b.type = "button"; b.className = "snb"; b.textContent = s.label;
      b.addEventListener("click", function(){
        var v = ta.value;
        if (/^\s*#[^\n]*\n?$/.test(v) || v.trim() === "") v = "";
        if (v && !/\n$/.test(v)) v += "\n";
        ta.value = v + s.code;
        ta.dispatchEvent(new Event("input", {bubbles:true}));
      });
      sn.appendChild(b);
    });
  } else sn.hidden = true;
  ta.readOnly = (st.type === "quiz");
  $("ideName").textContent = parsons ? "собери_программу.py" : "шаг_" + st.id + ".py";
}
function loadStep(a, b, fromNav){
  if (current) stopRun();
  var newLevel = (a !== li) || !$("lvlTitle").textContent;
  li = a; si = b;
  var L = LEVELS[li], st = L.steps[si];
  LS.set("pos:"+COURSE.id, li + ":" + si);
  ranOk = false; ranErr = false; badLine = null;
  fails[st.id] = 0; hints[st.id] = 0;
  $("left").style.setProperty("--c", "var(--" + L.c + ")");
  $("left").style.setProperty("--c-soft", "var(--" + L.c + "-soft)");
  $("lvlTitle").textContent = (L.id === "0" ? L.title : "Уровень " + L.id + ": " + L.title);
  $("lvlStory").textContent = L.story;
  $("stepTitle").textContent = "Шаг " + (si+1) + " из " + L.steps.length + ". " + st.title;
  $("stepSkill").textContent = "Учимся: " + st.skill;
  $("stepText").innerHTML = st.text;
  setIdeMode(st);
  if (st.type === "parsons"){ order = initialOrder(st); renderParsons(); }
  else { ta.value = (st.type === "quiz") ? st.starter : startCode(st); renderGutter(); }
  placeholder();

  var qb = $("quizBox"); qb.innerHTML = "";
  if (st.type === "quiz"){
    st.options.forEach(function(o, i){
      var bt = document.createElement("button");
      bt.type = "button"; bt.className = "opt"; bt.textContent = o;
      bt.addEventListener("click", function(){ answerQuiz(i, bt); });
      qb.appendChild(bt);
    });
  }
  $("btnCheck").hidden = (st.type === "quiz");
  $("btnHint").hidden = (st.type === "quiz" || !st.hint);
  var hb = $("hintBox"); hb.hidden = true; hb.innerHTML = "";
  $("solBox").hidden = true;
  setFeedback("", "");
  $("btnNext").hidden = true;
  $("btnPrev").disabled = (li === 0 && si === 0);
  if (si === 0 && L.hello) say("wave", L.hello);
  else say("read", START[st.type]);
  if (isDone(st)) showDone(st);
  renderNav(); renderDots(); postHeight();
}
function answerQuiz(i, btn){
  var st = stepOf(li, si);
  if (i === st.correct){
    btn.classList.add("good");
    var was = isDone(st);
    LS.set("done:"+st.id, "1");
    setFeedback("ok", "✅ Верно!<small>" + st.why + "</small>");
    finishStep(st, was, false);
  } else {
    btn.classList.add("bad");
    fails[st.id] = (fails[st.id] || 0) + 1;
    setFeedback("err", "Не совсем.<small>Нажми ▶ Запустить справа, введи ответ и посмотри, что получится. Потом выбери снова.</small>");
    say("think", pick(RETRY));
  }
}
function afterDone(){
  var nb = $("btnNext");
  var L = LEVELS[li];
  if (si + 1 < L.steps.length){ nb.textContent = "Дальше →"; nb.hidden = false; }
  else if (li + 1 < LEVELS.length){ nb.textContent = "К уровню " + LEVELS[li+1].id + " →"; nb.hidden = false; }
  else { nb.textContent = COURSE.next ? "К модулю «" + COURSE.next.title + "» →" : "К списку модулей →"; nb.hidden = false; }
  renderNav(); renderDots();
}
function showDone(st){
  if (st.type === "quiz"){
    $("quizBox").querySelectorAll(".opt")[st.correct].classList.add("good");
    setFeedback("ok", "✅ Шаг пройден.<small>" + st.why + "</small>");
  } else setFeedback("ok", "✅ Шаг пройден.");
  afterDone();
}
/* общий финал шага: помощник, достижения, уровень */
function finishStep(st, wasDone, clean){
  var L = LEVELS[li];
  if (st.bug) LS.set("bug:"+st.id, "1");
  if (st.type === "parsons") LS.set("pars:"+st.id, "1");
  if (st.own) LS.set("own:"+st.id, "1");
  var lvlNow = levelDone(L);
  if (lvlNow && L.id !== "0") LS.set("lvl:"+L.id, "1");
  if (!wasDone) report(st);
  if (clean && !wasDone && st.type !== "quiz" && st.type !== "run") LS.set("clean:"+st.id, "1");
  var fresh = checkAch();
  afterDone();
  var last = (si + 1 === L.steps.length);
  if (last && lvlNow && st.okMsg && !wasDone){ say("calm", st.okMsg); }
  else if (fresh.length){ say("wink", "Ого, новое достижение: " + fresh[0].name + "!"); }
  else say("joy", pick(PRAISE));
}
function success(st){
  var was = isDone(st);
  var clean = !fails[st.id] && !hints[st.id];
  LS.set("done:"+st.id, "1");
  var L = LEVELS[li];
  var last = (si + 1 === L.steps.length);
  var msg = "✅ Отлично!";
  if (last && st.okMsg) msg = "🎉 " + st.okMsg;
  setFeedback("ok", msg);
  finishStep(st, was, clean);
}
function failMsg(st, msg){
  fails[st.id] = (fails[st.id] || 0) + 1;
  setFeedback("err", msg || "Пока не получилось. Прочитай подсказку и попробуй ещё раз.");
  say("think", pick(RETRY));
  if (fails[st.id] >= 2 && st.type !== "quiz"){
    var sol = (st.type === "parsons") ? assemble(st, st.lines.map(function(_, i){ return i; })) : st.solution;
    if (sol){ $("solCode").textContent = sol; $("solBox").hidden = false; }
  }
}
function checkStep(){
  var st = stepOf(li, si);
  if (st.type === "parsons"){
    var r = checkOrder(st, order);
    if (r.ok) success(st);
    else failMsg(st, "Пока не так: порядок выполнен на " + r.good + " из " + r.total + ".<small>Нажми ▶ и посмотри, что получается. Подсказка поможет.</small>");
    return;
  }
  if (st.tests && st.tests.ranError){
    if (ranErr) success(st);
    else failMsg(st, "Сначала нажми ▶ Запустить справа и посмотри на сообщение об ошибке.");
    return;
  }
  if (st.tests && st.tests.ran){
    if (ranOk) success(st);
    else failMsg(st, "Сначала нажми ▶ Запустить справа, потом проверь.");
    return;
  }
  if (!skReady()){
    setFeedback("err", "Python не загрузился. Проверь интернет или доступ к cdn.jsdelivr.net в школьной сети и обнови страницу.");
    return;
  }
  if (current) stopRun();
  $("btnCheck").disabled = true;
  checkCode(st, ta.value, runSilent).then(function(res){
    $("btnCheck").disabled = false;
    if (res.ok){ success(st); return; }
    if (res.err){
      clearCons();
      if (/flood/.test(String(res.err))) out("— Слишком много строк. Похоже, цикл не заканчивается: проверь, меняется ли число внутри цикла. —\n", "err");
      else showError(res.err, true);
      failMsg(st, "Программа остановилась с ошибкой.<small>Прочитай сообщение в чёрном окне справа: там указана строка и подсказка.</small>");
      say("think", "Ошибка — это подсказка. Прочитай сообщение справа.");
    } else failMsg(st, res.msg);
  });
}

/* ---------- Навигация ---------- */
function renderNav(){
  var nav = $("levelNav");
  nav.innerHTML = "";
  LEVELS.forEach(function(L, a){
    var b = document.createElement("button");
    b.type = "button"; b.className = "lv" + (levelDone(L) ? " done" : "");
    b.style.setProperty("--c", "var(--" + L.c + ")");
    var doneN = L.steps.filter(isDone).length;
    b.innerHTML = '<span class="num"></span><span class="lbl"><b></b><small></small></span>';
    b.querySelector(".num").textContent = levelDone(L) ? "✓" : (L.id === "0" ? "★" : L.id);
    b.querySelector("b").textContent = L.title;
    b.querySelector("small").textContent = L.sub + " · " + doneN + "/" + L.steps.length;
    if (a === li) b.setAttribute("aria-current", "step");
    b.addEventListener("click", function(){ loadStep(a, 0); window.scrollTo({top:0}); });
    nav.appendChild(b);
  });
}
function renderDots(){
  var box = $("dots");
  box.innerHTML = "";
  LEVELS[li].steps.forEach(function(st, b){
    var d = document.createElement("button");
    d.type = "button"; d.className = "dot" + (isDone(st) ? " done" : "");
    d.textContent = isDone(st) ? "✓" : String(b+1);
    d.setAttribute("aria-label", "Шаг " + (b+1) + ": " + st.title);
    if (b === si) d.setAttribute("aria-current", "step");
    d.addEventListener("click", function(){ loadStep(li, b); });
    box.appendChild(d);
  });
}

/* ---------- Кнопки ---------- */
btnRun.addEventListener("click", run);
btnStop.addEventListener("click", stopRun);
$("btnCheck").addEventListener("click", checkStep);
$("btnHint").addEventListener("click", function(){
  var st = stepOf(li, si), hb = $("hintBox");
  hints[st.id] = (hints[st.id] || 0) + 1;
  hb.hidden = false;
  hb.innerHTML = "";
  var p = document.createElement("div"); p.textContent = "💡 " + st.hint; hb.appendChild(p);
  if (st.hintCode){ var pre = document.createElement("pre"); pre.textContent = st.hintCode; hb.appendChild(pre); }
  say("think", "Смотри подсказку слева.");
});
$("btnPrev").addEventListener("click", function(){
  if (si > 0) loadStep(li, si-1);
  else if (li > 0) loadStep(li-1, LEVELS[li-1].steps.length-1);
});
$("btnNext").addEventListener("click", function(){
  if (si + 1 < LEVELS[li].steps.length) loadStep(li, si+1);
  else if (li + 1 < LEVELS.length) loadStep(li+1, 0);
  else { location.href = COURSE.next ? "trainer.html?c=" + encodeURIComponent(COURSE.next.id) : "./"; return; }
  window.scrollTo({top:0});
});
var resetTimer = null;
btnReset.addEventListener("click", function(){
  if (btnReset.getAttribute("data-armed") === "1"){
    clearTimeout(resetTimer);
    btnReset.removeAttribute("data-armed");
    btnReset.textContent = "↺ Сначала";
    var st = stepOf(li, si);
    if (current) stopRun();
    if (st.type === "parsons"){ LS.del("ord:"+st.id); order = st.order.slice(); renderParsons(); }
    else { LS.del("code:"+st.id); ta.value = st.starter || ""; badLine = null; renderGutter(); }
    placeholder();
  } else {
    btnReset.setAttribute("data-armed", "1");
    btnReset.textContent = "Точно? Нажми ещё раз";
    resetTimer = setTimeout(function(){
      btnReset.removeAttribute("data-armed");
      btnReset.textContent = "↺ Сначала";
    }, 3000);
  }
});
window.addEventListener("resize", renderGutter);

/* ---------- Старт ---------- */
document.title = COURSE.title + " — Python с Оркеном";
document.querySelector(".hero h1").textContent = COURSE.title;
$("btnShare").addEventListener("click", function(){
  LS.set("share", sharing() ? "0" : "1");
  renderShare();
  toast(sharing() ? "Теперь результаты шагов отправляются учителю." : "Отправка результатов выключена.");
});
renderShare();
if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);
renderAch();
var pos = (LS.get("pos:"+COURSE.id) || (COURSE.start + ":0")).split(":");
var a0 = parseInt(pos[0],10), b0 = parseInt(pos[1],10);
if (!(a0 >= 0 && a0 < LEVELS.length) || !(b0 >= 0 && b0 < LEVELS[a0].steps.length)){ a0 = COURSE.start || 0; b0 = 0; }
loadStep(a0, b0);

})();
