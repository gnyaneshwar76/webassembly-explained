/** Try-it page: loads demo.wasm and wires the demo controls. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var I32_MIN = -2147483648, I32_MAX = 2147483647;
  var wasm = null; // the instance's exports once loaded

  function setStatus(state, text) {
    $('dot').dataset.state = state;
    $('status-text').textContent = text;
  }
  function fail(message) {
    setStatus('bad', 'Could not load module');
    $('load-error').textContent = message;
    $('load-error').hidden = false;
  }
  /** Parse a whole number from text, or return null. */
  function toInt(text, min, max) {
    var s = String(text).trim();
    if (!/^[+-]?\d+$/.test(s)) return null;
    var n = Number(s);
    return n >= min && n <= max ? n : null;
  }
  function say(id, text, kind) { var m = $(id); m.textContent = text; if (kind) m.dataset.kind = kind; else delete m.dataset.kind; }
  function setInvalid(input, bad) { input.setAttribute('aria-invalid', bad ? 'true' : 'false'); }

  function hexDump(bytes) {
    var lines = [];
    for (var i = 0; i < bytes.length; i += 16) {
      var row = Array.prototype.slice.call(bytes.subarray(i, i + 16)).map(function (b) { return ('0' + b.toString(16)).slice(-2); });
      lines.push(('0000' + i.toString(16)).slice(-4) + '  ' + row.join(' '));
    }
    return lines.join('\n');
  }

  // ---- add ----------------------------------------------------------------
  function runAdd() {
    var a = toInt($('add-a').value, I32_MIN, I32_MAX), b = toInt($('add-b').value, I32_MIN, I32_MAX);
    setInvalid($('add-a'), a === null); setInvalid($('add-b'), b === null);
    if (!wasm) return;
    if (a === null || b === null) { $('add-out').textContent = ''; say('add-msg', 'Enter whole numbers from -2,147,483,648 to 2,147,483,647.', 'error'); return; }
    $('add-out').textContent = 'add(' + a + ', ' + b + ') = ' + wasm.add(a, b);
    var exact = a + b;
    say('add-msg', exact > I32_MAX || exact < I32_MIN ? 'Overflow: the true sum is ' + exact + ', but a 32-bit integer wraps around.' : 'Fits in 32 bits.');
  }

  // ---- factorial ----------------------------------------------------------
  function runFactorial() {
    var n = toInt($('fact-n').value, 0, 20);
    setInvalid($('fact-n'), n === null);
    if (!wasm) return;
    if (n === null) { $('fact-out').textContent = ''; say('fact-msg', 'Enter a whole number from 0 to 20.', 'error'); return; }
    var r = wasm.factorial(n); // BigInt
    $('fact-out').textContent = n + '! = ' + r.toLocaleString('en-US');
    say('fact-msg', 'Returned to JavaScript as a ' + typeof r + '.');
  }

  // ---- sum (shared memory) --------------------------------------------------
  function runSum() {
    var input = $('sum-in');
    var parts = input.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    var vals = parts.map(function (s) { return toInt(s, I32_MIN, I32_MAX); });
    var bad = parts.length === 0 || parts.length > 1000 || vals.some(function (v) { return v === null; });
    setInvalid(input, bad);
    if (!wasm) return;
    if (bad) {
      $('sum-out').textContent = ''; $('sum-mem').textContent = '';
      say('sum-msg', parts.length > 1000 ? 'Use at most 1000 numbers.' : 'Enter 1 to 1000 whole numbers separated by commas.', 'error');
      return;
    }
    var view = new Int32Array(wasm.memory.buffer, 0, vals.length); // re-read buffer: it is replaced if memory grows
    view.set(vals);
    var total = wasm.sum(0, vals.length);
    var expected = vals.reduce(function (acc, v) { return (acc + v) | 0; }, 0);
    $('sum-out').textContent = 'sum = ' + total;
    say('sum-msg', 'Wrote ' + vals.length + ' values (' + vals.length * 4 + ' bytes) at offset 0. ' + (total === expected ? 'Matches the JavaScript sum.' : 'Does not match the JavaScript sum.'));
    var head = new Uint8Array(wasm.memory.buffer, 0, Math.min(16, vals.length * 4));
    $('sum-mem').textContent = 'memory[0..' + (head.length - 1) + '] = ' + Array.prototype.map.call(head, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(' ');
  }

  // ---- speed test ---------------------------------------------------------
  function fibJs(n) { return n < 2 ? n : fibJs(n - 1) + fibJs(n - 2); }
  function time(fn, n) { var t = performance.now(); var r = fn(n); return { ms: performance.now() - t, r: r }; }
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
  function ms(v) { return v.toFixed(1); }

  function runBench() {
    var n = toInt($('bench-n').value, 20, 38);
    setInvalid($('bench-n'), n === null);
    if (n === null) { say('bench-msg', 'Enter a whole number from 20 to 38.', 'error'); return; }
    $('bench-run').disabled = true;
    say('bench-msg', 'Running. The page may pause for a moment.');
    $('bench-verdict').textContent = '';
    setTimeout(function () { // let the browser paint the message first
      var fns = { wasm: wasm.fib, js: fibJs }, runs = { wasm: [], js: [] }, result;
      fns.wasm(25); fns.js(25); // warm-up
      for (var i = 0; i < 5; i++) {
        ['wasm', 'js'].forEach(function (k) { var t = time(fns[k], n); runs[k].push(t.ms); result = t.r; });
      }
      ['wasm', 'js'].forEach(function (k) {
        $('b-' + k + '-med').textContent = ms(median(runs[k]));
        $('b-' + k + '-all').textContent = runs[k].map(ms).join(', ');
      });
      $('bench-table').hidden = false;
      var ratio = median(runs.js) / median(runs.wasm);
      $('bench-verdict').textContent = (ratio > 1.05 ? 'WebAssembly was ' + ratio.toFixed(1) + 'x faster in this run.'
        : ratio < 0.95 ? 'JavaScript was ' + (1 / ratio).toFixed(1) + 'x faster in this run.'
        : 'About the same speed in this run.') + ' Both returned fib(' + n + ') = ' + result + '.';
      say('bench-msg', '');
      $('bench-run').disabled = false;
    }, 50);
  }

  // ---- load ---------------------------------------------------------------
  async function load() {
    if (typeof WebAssembly !== 'object') return fail('This browser does not support WebAssembly.');
    try {
      var res = await fetch('demo.wasm');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var bytes = new Uint8Array(await res.arrayBuffer());
      var result = await WebAssembly.instantiate(bytes); // fetched as bytes so the page can also show them
      wasm = result.instance.exports;
      var list = $('exports');
      WebAssembly.Module.exports(result.module).forEach(function (e) {
        var li = document.createElement('li');
        li.textContent = e.name + ' (' + e.kind + ')';
        list.appendChild(li);
      });
      $('module-info').textContent = 'demo.wasm is ' + bytes.length + ' bytes and exports ' + list.children.length + ' items.';
      $('hex').textContent = hexDump(bytes);
      setStatus('ok', 'Module loaded');
      $('bench-run').disabled = false;
      runAdd(); runFactorial(); runSum();
    } catch (e) {
      fail('Could not load demo.wasm (' + e.message + '). If you opened this file directly, serve the folder over HTTP instead, for example with: python3 -m http.server');
      $('module-info').textContent = 'The module did not load.';
    }
    try {
      var w = await fetch('demo.wat');
      $('wat').textContent = w.ok ? await w.text() : 'Source unavailable.';
    } catch (e) { $('wat').textContent = 'Source unavailable.'; }
    if (!wasm) $('hex').textContent = 'Bytes unavailable.';
  }

  ['add-a', 'add-b'].forEach(function (id) { $(id).addEventListener('input', runAdd); });
  $('fact-n').addEventListener('input', runFactorial);
  $('sum-in').addEventListener('input', runSum);
  $('bench-run').addEventListener('click', runBench);
  load();
})();
