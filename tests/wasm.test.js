// Run with: node tests/wasm.test.js   (checks the compiled demo.wasm using Node's built-in WebAssembly)
const assert = require('assert');
const fs = require('fs');
const path = require('path');

(async () => {
  const bytes = fs.readFileSync(path.join(__dirname, '..', 'demo.wasm'));
  assert.strictEqual(bytes.subarray(0, 8).toString('hex'), '0061736d01000000'); // magic number + version 1
  const { instance } = await WebAssembly.instantiate(bytes);
  const e = instance.exports;
  const fibJs = (n) => (n < 2 ? n : fibJs(n - 1) + fibJs(n - 2));

  assert.strictEqual(e.add(2, 3), 5);
  assert.strictEqual(e.add(2147483647, 1), -2147483648); // 32-bit wrap
  assert.strictEqual(e.factorial(0), 1n);
  assert.strictEqual(e.factorial(5), 120n);
  assert.strictEqual(e.factorial(20), 2432902008176640000n);
  for (let n = 0; n <= 20; n++) assert.strictEqual(e.fib(n), fibJs(n));
  new Int32Array(e.memory.buffer, 0, 4).set([10, 20, 30, -5]);
  assert.strictEqual(e.sum(0, 4), 55);
  assert.strictEqual(e.sum(0, 0), 0);
  console.log('demo.wasm: all checks passed');
})();
