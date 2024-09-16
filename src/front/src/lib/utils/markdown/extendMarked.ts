import {marked} from "marked";
import { blockLatexMarkedExtension, inlineLatexMarkedExtension } from "./latexInMarkdown";

export function extendMarked() {
  marked.use({
    extensions: [
      inlineLatexMarkedExtension,
      blockLatexMarkedExtension,
    ],
  });
}
