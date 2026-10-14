# 📑 Table of Contents — NotePlan Plugin

Inserts or refreshes a clickable Table of Contents at the top of the current note. Each entry is a `noteplan://` link that jumps to the target heading.

## Commands

- **Insert/Update Table of Contents** — aliases: `toc`, `insertTOC`, `updateTOC`
  Adds a TOC under the first H1 heading, or refreshes it if one already exists. After running, the cursor is placed at the start of the TOC.
- **Remove Table of Contents** — alias: `removeTOC`
  Removes the existing TOC block from the current note.

## How it works

- The TOC block starts with a marker line (default `## __TOC__`, configurable).
- It is inserted directly under the first H1 (`# Title`). The first H1 itself is **not** listed in the TOC.
- Each entry is a line made of:
  - `level − 1` tabs (so H2 entries have no indent, H3 has one tab, etc.)
  - a configurable prefix (default `- `, can be empty)
  - a markdown link `[label](url)`
- Links use the NotePlan x-callback-url scheme:
  `noteplan://x-callback-url/openNote?noteTitle=<note>%23<heading>` — clicking an entry opens the note at that heading.
- Label cleanup (display only; the link still targets the original heading):
  - A trailing `…` (collapsed-heading marker) is stripped from both the label and the link.
  - A NotePlan date reference `>YYYY-MM-DD` is rendered as ` - YYYY-MM-DD` in the label only; the link keeps the `>` so clicks still land on the real heading.
- Headings inside fenced code blocks (```` ``` ````) are ignored.
- Running the command again strips the previous TOC and rebuilds it — safe to re-run, and also safe after changing any of the settings below.

## Settings

| Key | Default | Description |
|---|---|---|
| `maxLevel` | `3` | Maximum heading level included in the TOC (1-6). Example: `3` → H1, H2, H3. |
| `tocMarker` | `## __TOC__` | Heading line that marks the start of the TOC block. Must start with `## ` so NotePlan treats it as a heading. |
| `bulletPrefix` | `- ` | String inserted between the tabs and the link on each entry. Set to empty for no prefix. |
| `_logLevel` | `INFO` | Verbosity of the plugin console logs (NotePlan → Help → Plugin Console). |

## Robustness

- TOC entries are detected by the presence of a markdown link to a `noteplan://` URL, not by the prefix, so changing `bulletPrefix` between runs still works (old entries are correctly replaced).
- The stripper stops as soon as a non-TOC line is encountered, so accidentally removing the blank line after the TOC will not destroy surrounding content on the next run.

## Install (manual)

1. NotePlan → Preferences → Plugins → **Open Plugins Folder**
2. Copy the `dmangin.TableOfContents/` folder into it.
3. Restart NotePlan (or reload plugins).
4. Trigger the command from the Command Bar (`⌘ + J`, then type `toc`).

## Requirements

- NotePlan 3.4.0+
