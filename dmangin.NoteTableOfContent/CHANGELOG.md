# Changelog

All notable changes to the **📑 Table of Contents** plugin are recorded here.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-04-22

### Added
- **Two commands**:
  - `Insert/Update Table of Contents` (aliases: `toc`, `insertTOC`, `updateTOC`) — inserts or refreshes the TOC under the first H1.
  - `Remove Table of Contents` (alias: `removeTOC`) — removes the TOC block from the current note.
- **TOC generation**:
  - Entries link to the target heading via `noteplan://x-callback-url/openNote?noteTitle=…%23…`.
  - Indentation based on heading level (`level − 1` tabs).
  - First H1 is excluded from the TOC.
  - Headings inside fenced code blocks (```` ``` ````) are ignored.
- **Label cleanup (display-only)**:
  - Trailing `…` (collapsed-heading marker) is stripped from both the label and the link target.
  - NotePlan date references `>YYYY-MM-DD` are rendered as ` - YYYY-MM-DD` in the label; the link keeps the original `>` so clicks still land on the real heading.
- **Cursor positioning**: after insert/update, the cursor is placed at the start of the TOC marker line.
- **Settings**:
  - `maxLevel` (default `3`) — deepest heading level included in the TOC.
  - `tocMarker` (default `## __TOC__`) — configurable marker line.
  - `bulletPrefix` (default `- `) — configurable bullet prefix; may be empty.
  - `_logLevel` — log verbosity for the Plugin Console.
- **Robust detection**: TOC lines are identified by the presence of a `noteplan://` markdown link, independent of the prefix, so changing `bulletPrefix` between runs replaces old entries cleanly instead of duplicating them. If the blank line separating the TOC from the rest of the note is removed, the stripper still stops at the first non-TOC line (no risk of deleting surrounding content).
