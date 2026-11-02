# WebAssembly, explained

A short, plain-language guide to WebAssembly (Wasm) with a live demo. The demo loads `demo.wasm`, a module written by hand in the text format, and calls it from JavaScript. Plain HTML, CSS and JavaScript with no build step and no dependencies.

Live site: https://gnyaneshwar76.github.io/webassembly-explained/

Independent student project. Not affiliated with webassembly.org or the W3C.

## Run it

The demo fetches `demo.wasm`, so serve the folder over HTTP (opening the file directly will not work):

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Pages

| Page | Content |
|---|---|
| `index.html` | Overview, the four ideas behind Wasm, key facts |
| `what-is-wasm.html` | Concepts: why it exists, how a module runs, core terms, text vs binary, versions |
| `try-it.html` | Live demo: module bytes and source, `add`, `factorial`, `sum` through shared memory, a speed test against JavaScript |
| `languages.html` | Languages and tools that target Wasm |
| `resources.html` | Official and learning links |
| `privacy.html`, `404.html` | Site basics |

## The demo module

`demo.wat` is the source. `demo.wasm` is the compiled result (204 bytes), built with [WABT](https://github.com/WebAssembly/wabt):

```
wat2wasm demo.wat -o demo.wasm
node tests/wasm.test.js
```

It exports `add`, `factorial`, `fib`, `sum` and a `memory`. `try-it.js` loads it with `fetch` and `WebAssembly.instantiate`, validates every input, and shows loading and error states.

The speed test reports the real measured times. For simple integer code, modern JavaScript is also very fast, so the result can be close or favour either side.

## Files

`style.css` (design tokens and layout), `try-it.js` (demo logic), `fonts/` (IBM Plex, self-hosted, SIL Open Font License), `robots.txt`, `sitemap.xml`, `favicon.svg`, `og.png`.

## Deploy (GitHub Pages)

Repository Settings, Pages, deploy from branch `main`, folder `/ (root)`. Tick **Enforce HTTPS**.

## Sources

Facts are drawn from [webassembly.org](https://webassembly.org/), [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly), the [W3C 2019 announcement](https://www.w3.org/press-releases/2019/wasm) and [SD Times on version 3.0](https://sdtimes.com/softwaredev/wasm-3-0-standard-is-now-officially-complete/).
