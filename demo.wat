;; demo.wat - the module used on the "Try it" page.
;; Compile with WABT:  wat2wasm demo.wat -o demo.wasm
(module
  ;; One 64 KiB page of memory, shared with JavaScript.
  (memory (export "memory") 1)

  ;; add(a, b): two 32-bit integers in, one out. Wraps around on overflow.
  (func (export "add") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)

  ;; factorial(n): loop, 64-bit result. Correct for n up to 20.
  (func (export "factorial") (param i32) (result i64)
    (local i64)
    i64.const 1
    local.set 1
    (block $done
      (loop $next
        local.get 0
        i32.eqz
        br_if $done
        local.get 1
        local.get 0
        i64.extend_i32_u
        i64.mul
        local.set 1
        local.get 0
        i32.const 1
        i32.sub
        local.set 0
        br $next))
    local.get 1)

  ;; fib(n): deliberately naive recursion, so it does real work for the timing test.
  (func $fib (export "fib") (param i32) (result i32)
    local.get 0
    i32.const 2
    i32.lt_s
    if (result i32)
      local.get 0
    else
      local.get 0
      i32.const 1
      i32.sub
      call $fib
      local.get 0
      i32.const 2
      i32.sub
      call $fib
      i32.add
    end)

  ;; sum(ptr, len): add up len 32-bit integers stored in memory starting at byte ptr.
  (func (export "sum") (param $ptr i32) (param $len i32) (result i32)
    (local $acc i32)
    (block $done
      (loop $next
        local.get $len
        i32.eqz
        br_if $done
        local.get $acc
        local.get $ptr
        i32.load
        i32.add
        local.set $acc
        local.get $ptr
        i32.const 4
        i32.add
        local.set $ptr
        local.get $len
        i32.const 1
        i32.sub
        local.set $len
        br $next))
    local.get $acc)
)
