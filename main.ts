/**
 * main.ts - the program the grading harness runs under node 22.
 *
 * Reads $MAKEFUN_INPUT_DIR/cases.json (default /input), a JSON array of
 * {id, markdown}, renders every case on its own through parse() from
 * ./parse.js, and writes $MAKEFUN_OUTPUT_DIR/html.json (default /output) as a
 * JSON array of HTML strings in the same order. Diagnostics go to stderr so
 * stdout stays clean.
 */
import { readFileSync, writeFileSync, mkdirSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

type Case = { id?: string | number; markdown: string };

const started: number = performance.now();
const inputDir: string = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  writeSync(2, `main.ts: ${message}\n`);
  process.exit(1);
}

const casesPath: string = join(inputDir, 'cases.json');
let raw: string;
try {
  raw = readFileSync(casesPath, 'utf8');
} catch (err) {
  fail(`cannot read ${casesPath}: ${(err as Error).message}`);
}

let cases: unknown;
try {
  cases = JSON.parse(raw);
} catch (err) {
  fail(`${casesPath} is not valid JSON: ${(err as Error).message}`);
}
if (!Array.isArray(cases)) {
  fail(`${casesPath} must contain a JSON array of {id, markdown} cases, got ${typeof cases}`);
}

const html: string[] = new Array(cases.length);
const renderStart: number = performance.now();
for (let i = 0; i < cases.length; i++) {
  const item = cases[i] as Case;
  if (item === null || typeof item !== 'object' || typeof item.markdown !== 'string') {
    fail(`case at index ${i} has no string "markdown" field`);
  }
  html[i] = parse(item.markdown);
}

const htmlPath: string = join(outputDir, 'html.json');
try {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(htmlPath, JSON.stringify(html));
} catch (err) {
  fail(`cannot write ${htmlPath}: ${(err as Error).message}`);
}

const rendered: number = performance.now() - renderStart;
const elapsed: number = performance.now() - started;
writeSync(
  2,
  `main.ts: rendered ${cases.length} cases in ${rendered.toFixed(1)} ms` +
    ` (${elapsed.toFixed(1)} ms total) -> ${htmlPath}\n`,
);
