import type { MarkedExtension, TokenizerAndRendererExtension } from "marked";

const inlineRule =
  /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1(?=[\s?!\.,:？！。，：]|$)/;
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

export const inlineLatexMarkedExtension: TokenizerAndRendererExtension = {
  name: "inlineTex",
  level: "inline",
  start(src: string) {
    let index;
    let indexSrc = src;

    while (indexSrc) {
      index = indexSrc.indexOf("$");
      if (index === -1) {
        return;
      }

      if (index === 0 || indexSrc.charAt(index - 1) === " ") {
        const possibleKatex = indexSrc.substring(index);

        if (possibleKatex.match(inlineRule)) {
          return index;
        }
      }

      indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, "");
    }
  },
  tokenizer(src: string) {
    const match = src.match(inlineRule);
    if (match) {
      return {
        type: "inlineTex",
        raw: match[0],
        text: match[2].trim(),
        displayMode: match[1].length === 2,
      };
    }
  },
};

export const blockLatexMarkedExtension: TokenizerAndRendererExtension = {
  name: "blockTex",
  level: "block",
  tokenizer(src: string) {
    const match = src.match(blockRule);
    if (match) {
      return {
        type: "blockTex",
        raw: match[0],
        text: match[2].trim(),
        displayMode: match[1].length === 2,
      };
    }
  },
};
