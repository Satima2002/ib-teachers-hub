/* Проверка модулей без браузера: node tests/validate.js
   Для каждого шага: решение проходит проверку, заготовка (starter) её не проходит.
   Нужны node и python3. Шаги с намеренной ошибкой в заготовке помечены "ожидаемо". */
var cp = require("child_process"), path = require("path");
var core = require("../core.js");
global.registerCourse = function(c){ (global.COURSES = global.COURSES || []).push(c); };
var files = ["basics","conditions","loops","game"];
files.forEach(function(f){ require(path.join("..","courses",f+".js")); });

/* python3 вместо Skulpt; input() берёт значения из списка */
function py(code, inputs){
  var w = "import builtins,sys,json\nit=iter(json.loads(sys.argv[1]))\nbuiltins.input=lambda p='': next(it,'')\nexec(compile(sys.stdin.read(),'<s>','exec'))\n";
  var r = cp.spawnSync("python3", ["-c", w, JSON.stringify(inputs)], {input: code, encoding: "utf-8", timeout: 5000});
  return Promise.resolve(r.status === 0 ? {ok:true, out:r.stdout} : {ok:false, out:r.stdout, err:r.stderr});
}
var EXPECT_ERR = {"2-1":1, "2-5":1, "7-2":1};   /* заготовка намеренно с ошибкой */
var bad = 0, total = 0, ids = {};
(async function(){
  for (var c of COURSES) for (var L of c.levels) for (var st of L.steps){
    total++;
    if (ids[st.id]) { console.log("ДУБЛЬ id", st.id); bad++; }
    ids[st.id] = 1;
    var ok = true, info = "";
    if (st.type === "parsons"){
      var sol = st.lines.map(function(_, i){ return i; });
      var a = core.checkOrder(st, sol).ok, b = core.checkOrder(st, st.order).ok;
      var r = await py(core.assemble(st, sol), ["Арман","Тулпар","1","1"]);
      ok = a && !b && r.ok; info = "parsons";
    } else if (st.type === "quiz"){
      var q = await py(st.starter, ["Айдана","2"]);
      ok = q.ok || !!EXPECT_ERR[st.id]; info = "quiz";
    } else if (st.tests && (st.tests.ran || st.tests.ranError)){
      var rr = await py(st.starter, ["3","7","Арман"]);
      ok = st.tests.ranError ? !rr.ok : rr.ok; info = "run";
    } else {
      var s = await core.checkCode(st, st.solution, py);
      var f = await core.checkCode(st, st.starter, py);
      ok = s.ok && !f.ok; info = "edit solution=" + s.ok + " starter-fails=" + !f.ok;
    }
    if (!ok){ bad++; console.log("ПЛОХО", c.id, st.id, info); }
  }
  console.log("шагов:", total, "ошибок:", bad);
  process.exit(bad ? 1 : 0);
})();
