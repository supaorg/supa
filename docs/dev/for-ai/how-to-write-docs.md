# How to write docs

Write them simply.

## Rule for the agent

* Lead with the key action or fact.
* Use plain words. Avoid jargon; if a term is required, define it once.
* Write short sentences (aim ≤ 15 words).
* Use active voice: “Do X,” not “X should be done.”
* One idea per sentence. One task per paragraph.
* Prefer lists and steps over long paragraphs.
* State defaults, constraints, and examples near the instruction.
* Delete filler, hedging, and marketing language.
* Use consistent terms and formatting.

## Do / Don’t

**Do**

* Show a minimal example right after the instruction.
* Name buttons, flags, files, and paths exactly.
* Call out prerequisites and errors up front.

**Don’t**

* Start with history or philosophy.
* Use acronyms without expanding them once.
* Stack multiple clauses or metaphors.

## Tiny example

**Before:** “In order to facilitate initialization, the system should be configured accordingly.”
**After:** “Configure the system. Then run `init`.”