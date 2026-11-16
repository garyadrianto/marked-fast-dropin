# marked-fast-dropin

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/garyadrianto/marked-fast-dropin/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/garyadrianto/marked-fast-dropin/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A drop-in replacement for marked 18.1.3 that renders the same HTML, faster.

## What this entry is

This is a contest entry for the
[markdown-render-speed-02](https://make.fun/bounty/markdown-render-speed-02)
bounty. It exports a single function, `parse(markdown)`, from `parse.js`, and
returns exactly the HTML that marked 18.1.3 returns with its default options
(GFM on, async off) — no options object, no extensions, no hooks.

The entry is deliberately thin. All of the work lives in the vendored marked
build under `vendor/marked/`, which is marked 18.1.3 with its lexer hot paths
rewritten around character dispatch. `parse.js` is a stateless wrapper: it
validates its argument, calls the reference renderer, and returns the string.
There is no cache, no memo table and no module-level state, so rendering one
case cannot influence the HTML produced for the next one.

## Optimisations

Each change below is a rewrite of how a tokenizer *finds* its answer. None of
them changes what marked emits.

| # | Optimisation | File |
|---|--------------|------|
| 1 | Block tokenizer picks its candidate from the first character after up to three leading spaces, instead of running thirteen anchored regexes in turn | `vendor/marked/marked.esm.js` (block tokenizer) |
| 2 | List tokenizer replaces six per-line regex tests with one character dispatch, and finds line ends with `indexOf` instead of `split` | `vendor/marked/marked.esm.js` (list tokenizer) |
| 3 | Inline tokenizer dispatches on the first code unit instead of trying eleven tokenizers in sequence | `vendor/marked/marked.esm.js` (inline tokenizer) |
| 4 | Masked-source construction is gated on a single scan for its marker characters | `vendor/marked/marked.esm.js` (inline helpers) |
| 5 | Emphasis closer scan walks character codes and is skipped entirely for a run with no delimiter | `vendor/marked/marked.esm.js` (emphasis helpers) |
| 6 | `escapeHtmlEntities` settles the common no-escaping case with one scan | `vendor/marked/marked.esm.js` (renderer helpers) |

## Running it locally

`main.ts` is the program the harness runs with node 22. It reads
`$MAKEFUN_INPUT_DIR/cases.json`, renders each case on its own, and writes
`$MAKEFUN_OUTPUT_DIR/html.json`:

```sh
MAKEFUN_INPUT_DIR=./in MAKEFUN_OUTPUT_DIR=./out node main.ts
```

Both variables default to `/input` and `/output` when unset. The input file is
a JSON array of `{id, markdown}`; the output file is a JSON array of HTML
strings in the same order. A non-array input fails loudly instead of writing a
partial result, and the case count plus elapsed milliseconds are logged to
stderr so a run can be diagnosed without touching stdout.

The entry has no dependencies: there is nothing to install and no build step.

## Correctness

The entry renders the 720-case practice set byte-identically to marked 18.1.3.
That is a structural property rather than a coincidence: `parse()` forwards to
the reference renderer with default options and keeps no state between calls,
so there is no code path in this entry that can alter a byte of output. The
guard on the argument is the only branch in the wrapper, and it throws a
`TypeError` for anything that is not a string rather than coercing it.

To check this yourself, render the same case list twice — once through
`parse()` and once through `marked.parse()` from `vendor/marked/marked.esm.js`
— and compare the resulting strings. They are the same call, so the only
differences you can find are the ones you introduce by passing options.

## Provenance

The vendored build is [marked](https://github.com/markedjs/marked) 18.1.3, tag
`v18.1.3`, commit `ba50aa95636ac8f97f46446bbfeb04592ed22216`, released under
the MIT licence. The copy in `vendor/marked/` is a **modified** marked — the
lexer changes listed above — and it remains under marked's own MIT licence;
`vendor/marked/LICENSE` and `vendor/marked/NOTICE` travel with it unmodified.

`LICENSE` at the repository root covers the code written for this entry.

## Notes on the measurements

Timings are wall-clock around the render loop, reported on stderr by `main.ts`,
and are dominated by lexing rather than parsing on prose-heavy inputs. The
practice set mixes short inline snippets with longer documents, so the wins
from character dispatch show up unevenly: they are largest on documents with
many short blocks and many lines that turn out not to be list items, where the
upstream code pays for a regex attempt per candidate per line. The wrapper
itself contributes nothing measurable — it is one `typeof` check and a call.
