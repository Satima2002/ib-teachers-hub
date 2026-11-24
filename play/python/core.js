/* Чистые функции проверки заданий. Работают и в браузере, и в Node (для тестов). */
function stripC(c){ return c.replace(/#.*$/gm, ""); }

/* Проверка кода шага. runner(code, inputs) -> Promise({ok,out,err}) */
function checkCode(st, code, runner){
  var t = st.tests || {};
  var plain = stripC(code);
  var i;
  if (/___/.test(plain)) return Promise.resolve({ok:false, msg:"В коде остались пропуски ___. Замени их."});
  var not = t.not || [];
  for (i=0;i<not.length;i++){ if (not[i].re.test(plain)) return Promise.resolve({ok:false, msg:not[i].msg}); }
  var must = t.must || [];
  for (i=0;i<must.length;i++){ if (!must[i].re.test(plain)) return Promise.resolve({ok:false, msg:must[i].msg}); }
  var count = t.count || [];
  for (i=0;i<count.length;i++){
    var m = plain.match(count[i].re) || [];
    if (m.length < count[i].min) return Promise.resolve({ok:false, msg:count[i].msg});
  }
  var runs = t.runs || (st.type === "edit" ? [{inputs:[]}] : []);
  return runs.reduce(function(p, r){
    return p.then(function(prev){
      if (!prev.ok) return prev;
      return runner(code, r.inputs || []).then(function(res){
        if (!res.ok) return {ok:false, msg:null, err:res.err};
        var o = res.out, k;
        var bad = r.msg || "Программа показала не то, что ожидалось.";
        if (r.nonEmpty && o.trim().length === 0) return {ok:false, msg:bad};
        if (r.minLines && o.trim().split("\n").length < r.minLines) return {ok:false, msg:bad};
        var has = r.has || [], hasNot = r.hasNot || [];
        for (k=0;k<has.length;k++){ if (o.indexOf(has[k]) < 0) return {ok:false, msg:bad}; }
        for (k=0;k<hasNot.length;k++){ if (o.indexOf(hasNot[k]) >= 0) return {ok:false, msg:bad}; }
        if (r.inOrder){
          var last = -1;
          for (k=0;k<r.inOrder.length;k++){
            var at = o.indexOf(r.inOrder[k], last + 1);
            if (at < 0) return {ok:false, msg:bad};
            last = at;
          }
        }
        return {ok:true};
      });
    });
  }, Promise.resolve({ok:true}));
}

/* Проверка порядка строк (сборка программы). order — массив индексов строк сверху вниз */
function checkOrder(st, order){
  var pos = {}, i, good = 0;
  order.forEach(function(idx, p){ pos[idx] = p; });
  for (i=0;i<st.constraints.length;i++){
    var a = st.constraints[i][0], b = st.constraints[i][1];
    if (pos[a] < pos[b]) good++;
  }
  return {ok: good === st.constraints.length, good:good, total:st.constraints.length};
}
function assemble(st, order){ return order.map(function(i){ return st.lines[i]; }).join("\n") + "\n"; }

if (typeof module!=="undefined") module.exports={stripC:stripC,checkCode:checkCode,checkOrder:checkOrder,assemble:assemble};
