/**
 * parse.js - the module the harness imports.
 *
 * `parse(markdown)` is a thin, stateless wrapper: it forwards straight to the
 * vendored marked 18.1.3 build in ./vendor/marked/marked.esm.js with marked's
 * default options (gfm on, async off). There is no cache, no memo table and no
 * module-level state of any kind, so rendering one case cannot influence the
 * HTML produced for the next one.
 *
 * What the vendored build changes against upstream marked 18.1.3
 * ---------------------------------------------------------------
 * The lexer hot paths are rewritten around character dispatch; the output is
 * unchanged, only the way each tokenizer finds its answer differs.
 *
 *  1. Block tokenizer: instead of running thirteen anchored regexes in turn
 *     for every block, the candidate is picked from the first character after
 *     up to three leading spaces. One switch replaces the whole ladder.
 *
 *  2. List tokenizer: six per-line regex tests collapse into a single
 *     character dispatch, and line ends are located with indexOf instead of
 *     splitting the entire source into an array of lines first.
 *
 *  3. Inline tokenizer: dispatch on the first code unit replaces a chain of
 *     eleven tokenizer attempts, so most characters never reach a regex.
 *
 *  4. Masked-source construction is gated on a single scan for its marker
 *     characters, so it is skipped outright when none are present.
 *
 *  5. The emphasis closer scan walks character codes rather than building
 *     substrings, and is skipped outright for a run with no delimiter in it.
 *
 *  6. escapeHtmlEntities settles the common no-escaping case with one scan, so
 *     ordinary prose is copied through instead of entity-by-entity.
 *
 * The vendored file is a modified marked and stays under marked's own MIT
 * licence; see vendor/marked/LICENSE and vendor/marked/NOTICE.
 *
 * Contract
 * --------
 * parse(string) -> string, byte-identical to marked.parse(string) under
 * default options. Nothing else is configurable from here: no options object
 * is read, no renderer is injected and no hook is registered, so a case can
 * only ever be affected by its own source text.
 */

import { marked } from './vendor/marked/marked.esm.js';

/**
 * Render a markdown document to HTML exactly as marked 18.1.3 does by default.
 *
 * @param {string} markdown source document
 * @returns {string} rendered HTML
 * @throws {TypeError} when `markdown` is not a string
 */
export function parse(markdown) {
  if (typeof markdown !== 'string') {
    const got = markdown === null ? 'null' : typeof markdown;
    throw new TypeError(`parse(markdown): expected a string, received ${got}`);
  }
  return marked.parse(markdown);
}

export default parse;
