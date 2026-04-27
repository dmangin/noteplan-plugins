// @flow
// NotePlan plugin: Table of Contents
// Inserts or refreshes a clickable TOC under the first H1 of the current note.

var exports = typeof exports !== 'undefined' ? exports : {}

const DEFAULT_TOC_MARKER = '## __TOC__'
const DEFAULT_BULLET_PREFIX = '- '
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/
const FENCE_RE = /^\s*(```|~~~)/
const TOC_LINE_RE = /^\t*.*?\[.+?\]\(noteplan:\/\//

function getTocMarker() {
    try {
        const raw = DataStore.settings && DataStore.settings.tocMarker
        if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
    } catch (e) {}
    return DEFAULT_TOC_MARKER
}

function getBulletPrefix() {
    try {
        const raw = DataStore.settings && DataStore.settings.bulletPrefix
        if (typeof raw === 'string') return raw
    } catch (e) {}
    return DEFAULT_BULLET_PREFIX
}

function stripCollapseMarker(text) {
    return text.replace(/\s+…\s*$/, '').trim()
}

function cleanHeadingText(text) {
    let cleaned = stripCollapseMarker(text)
    cleaned = cleaned.replace(/\s*>(\d{4}-\d{2}-\d{2})/g, ' - $1').replace(/^\s+-\s+/, '')
    return cleaned.trim()
}

function log(msg) {
    try {
        console.log('[TOC] ' + msg)
    } catch (e) {}
}

function showError(msg) {
    log('ERROR: ' + msg)
    if (typeof CommandBar !== 'undefined' && typeof CommandBar.prompt === 'function') {
        CommandBar.prompt('Table of Contents', msg)
    }
}

function moveCursor(offset) {
    if (typeof offset !== 'number' || offset < 0) return
    try {
        if (typeof Editor !== 'undefined' && typeof Editor.select === 'function') {
            Editor.select(offset, 0)
            return
        }
    } catch (e) {
        log('Editor.select failed: ' + (e && e.message ? e.message : String(e)))
    }
    try {
        if (typeof Editor !== 'undefined' && typeof Editor.renderedSelect === 'function') {
            Editor.renderedSelect(offset, 0)
        }
    } catch (e) {
        log('Editor.renderedSelect failed: ' + (e && e.message ? e.message : String(e)))
    }
}

function getMaxLevel() {
    try {
        const raw = (DataStore.settings && DataStore.settings.maxLevel) || '3'
        const n = parseInt(raw, 10)
        if (!Number.isInteger(n) || n < 1 || n > 6) return 3
        return n
    } catch (e) {
        return 3
    }
}

function stripExistingToc(lines, marker) {
    const idx = lines.findIndex(function (l) {
        return l.trim() === marker
    })
    if (idx === -1) return { lines: lines, removed: false }
    let end = idx + 1
    while (end < lines.length && TOC_LINE_RE.test(lines[end])) end++
    const next = lines.slice(0, idx).concat(lines.slice(end))
    return { lines: next, removed: true }
}

function collectHeadings(lines, maxLevel) {
    const headings = []
    let inFence = false
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (FENCE_RE.test(line)) {
            inFence = !inFence
            continue
        }
        if (inFence) continue
        const m = HEADING_RE.exec(line)
        if (!m) continue
        const level = m[1].length
        if (level > maxLevel) continue
        headings.push({ level: level, text: m[2], lineIndex: i })
    }
    return headings
}

function buildTocLines(headings, noteTitle, bulletPrefix) {
    const encodedTitle = encodeURIComponent(noteTitle)
    return headings.map(function (h) {
        const label = cleanHeadingText(h.text)
        const encodedContent = encodeURIComponent(stripCollapseMarker(h.text))
        const href = 'noteplan://x-callback-url/openNote?noteTitle=' + encodedTitle + '%23' + encodedContent
        return '\t'.repeat(h.level - 1) + bulletPrefix + '[' + label + '](' + href + ')'
    })
}

function buildUpdatedContent(text, noteTitle, maxLevel, marker, bulletPrefix) {
    const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n'
    const originalLines = text.split(/\r?\n/)

    const stripped = stripExistingToc(originalLines, marker)
    const lines = stripped.lines

    const headings = collectHeadings(lines, maxLevel)
    const firstH1 = headings.find(function (h) {
        return h.level === 1
    })
    if (!firstH1) {
        return { content: lines.join(eol), status: 'no-h1', removed: stripped.removed }
    }
    const tocHeadings = headings.filter(function (h) {
        return h !== firstH1
    })
    if (tocHeadings.length === 0) {
        return { content: lines.join(eol), status: 'no-sub-headings', removed: stripped.removed }
    }

    const insertAt = firstH1.lineIndex + 1
    const before = lines.slice(0, insertAt)
    const after = lines.slice(insertAt)
    while (after.length > 0 && after[0].trim() === '') after.shift()

    const tocBlock = [''].concat(marker, buildTocLines(tocHeadings, noteTitle, bulletPrefix), '')

    const finalLines = before.concat(tocBlock, after)
    const cursorOffset = before.concat(tocBlock.slice(0, 1)).join(eol).length + eol.length

    return {
        content: finalLines.join(eol),
        status: stripped.removed ? 'updated' : 'inserted',
        count: tocHeadings.length,
        cursorOffset: cursorOffset,
    }
}

async function insertTableOfContents() {
    try {
        if (typeof Editor === 'undefined' || Editor.content == null) {
            showError('No active note. Open a note first.')
            return
        }
        const maxLevel = getMaxLevel()
        const marker = getTocMarker()
        const bulletPrefix = getBulletPrefix()
        const noteTitle = Editor.title && Editor.title.length ? Editor.title : 'buffer'
        const result = buildUpdatedContent(Editor.content, noteTitle, maxLevel, marker, bulletPrefix)

        if (result.status === 'no-h1') {
            showError('No H1 heading (# Title) found — cannot decide where to place the TOC.')
            return
        }
        if (result.status === 'no-sub-headings') {
            showError('Only the root H1 was found — nothing to list in the TOC.')
            return
        }

        Editor.content = result.content
        moveCursor(result.cursorOffset)
        log((result.status === 'updated' ? 'Updated' : 'Inserted') + ' TOC (' + result.count + ' entries, maxLevel=' + maxLevel + ')')
    } catch (err) {
        showError('Unexpected error: ' + (err && err.message ? err.message : String(err)))
    }
}

async function removeTableOfContents() {
    try {
        if (typeof Editor === 'undefined' || Editor.content == null) {
            showError('No active note. Open a note first.')
            return
        }
        const text = Editor.content
        const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n'
        const stripped = stripExistingToc(text.split(/\r?\n/), getTocMarker())
        if (!stripped.removed) {
            showError('No TOC found in the current note.')
            return
        }
        Editor.content = stripped.lines.join(eol)
        log('Removed TOC block')
    } catch (err) {
        showError('Unexpected error: ' + (err && err.message ? err.message : String(err)))
    }
}

globalThis.insertTableOfContents = insertTableOfContents
globalThis.removeTableOfContents = removeTableOfContents

exports.insertTableOfContents = insertTableOfContents
exports.removeTableOfContents = removeTableOfContents
