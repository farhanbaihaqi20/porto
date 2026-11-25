// ALL content is read from Markdown files in src/content/.
// To edit the site, edit those .md files. No component code changes needed.
const mdFiles = import.meta.glob("../content/**/*.md", { query: "?raw", import: "default", eager: true })
const imgFiles = import.meta.glob("../assets/**/*.{webp,jpg,jpeg,png,svg}", { import: "default", eager: true })

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

function parseValue(v) {
  v = v.trim()
  if (v.startsWith("[") && v.endsWith("]")) {
    // split by comma, but respect commas inside quotes
    const inner = v.slice(1, -1)
    const parts = []
    let cur = "", inQ = false, qChar = ""
    for (const ch of inner) {
      if ((ch === '"' || ch === "'") && (!inQ || qChar === ch)) {
        inQ = !inQ
        qChar = inQ ? ch : ""
      }
      if (ch === "," && !inQ) { parts.push(cur); cur = "" } else cur += ch
    }
    if (cur.trim()) parts.push(cur)
    return parts.map(s => stripQuotes(s.trim())).filter(Boolean)
  }
  if (v === "true") return true
  if (v === "false") return false
  if (/^-?\d+$/.test(v)) return Number(v)
  return stripQuotes(v)
}

function isBalancedArray(s) {
  let depth = 0, inQ = false, qChar = ""
  for (const ch of s) {
    if ((ch === '"' || ch === "'") && (!inQ || qChar === ch)) {
      inQ = !inQ
      qChar = inQ ? ch : ""
    }
    if (!inQ) {
      if (ch === "[") depth++
      else if (ch === "]") depth--
    }
  }
  return depth <= 0
}

function parseMd(raw) {
  // Normalisasi CRLF (Windows / git autocrlf) ke LF dulu.
  // Tanpa ini, clone di Windows membuat semua frontmatter gagal dibaca.
  raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw.trim() }
  const data = {}
  let curKey = null
  let arrayBuf = ""

  for (const line of m[1].split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (arrayBuf) {
      arrayBuf += " " + trimmed
      if (isBalancedArray(arrayBuf)) {
        data[curKey] = parseValue(arrayBuf)
        arrayBuf = ""
        curKey = null
      }
      continue
    }

    if (curKey && trimmed.startsWith("[")) {
      arrayBuf = trimmed
      if (isBalancedArray(arrayBuf)) {
        data[curKey] = parseValue(arrayBuf)
        arrayBuf = ""
        curKey = null
      }
      continue
    }

    if (curKey && /^-\s+/.test(trimmed)) {
      const item = parseValue(trimmed.replace(/^-\s+/, ""))
      data[curKey] = Array.isArray(data[curKey]) ? [...data[curKey], item] : [item]
      continue
    }

    const i = line.indexOf(":")
    if (i > 0) {
      const key = line.slice(0, i).trim()
      const val = line.slice(i + 1).trim()
      if (val.startsWith("[") && !isBalancedArray(val)) {
        curKey = key
        arrayBuf = val
      } else {
        data[key] = parseValue(val)
        curKey = val === "" ? key : null
      }
    }
  }
  return { data, body: m[2].trim() }
}

function resolveImage(name) {
  if (!name) return ""
  const key = Object.keys(imgFiles).find(k => k.endsWith("/" + name) || k.endsWith(name))
  return key ? imgFiles[key] : ""
}

function load(kind) {
  return Object.entries(mdFiles)
    .filter(([path]) => path.includes(`/content/${kind}/`))
    .map(([path, raw]) => {
      const { data, body } = parseMd(raw)
      return {
        slug: path.split("/").pop().replace(".md", ""),
        ...data,
        body,
        paragraphs: body.split(/\n\n+/).filter(Boolean),
        imageUrl: resolveImage(data.image),
        imageFullUrl: resolveImage(data.imageFull || data.image),
      }
    })
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

function expSortKey(item) {
  const period = String(item.period || "")
  const rawDate = String(item.date || item.endDate || "").trim()
  const isOngoing = item.ongoing === true || /present|now|current/i.test(period) || /^present$/i.test(rawDate)

  let ts = 0
  if (rawDate && !/^present$/i.test(rawDate)) {
    const normalized = /^\d{4}-\d{2}$/.test(rawDate) ? `${rawDate}-01` : /^\d{4}$/.test(rawDate) ? `${rawDate}-12-31` : rawDate
    const parsed = Date.parse(normalized)
    if (!Number.isNaN(parsed)) ts = parsed
  }

  if (!ts && period) {
    const matches = [...period.matchAll(/\b(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(\d{4})\b/gi)]
    for (const m of matches) {
      const y = Number(m[2])
      const mo = m[1] ? MONTHS[m[1].toLowerCase().slice(0, 3)] : 12
      const candidate = Date.UTC(y, mo - 1, 1)
      if (candidate > ts) ts = candidate
    }
  }

  return { isOngoing: isOngoing ? 1 : 0, ts, order: Number(item.order) || 99 }
}

export const certificates = load("certificates").sort((a, b) => (b.date || "").localeCompare(a.date || ""))
export const projects = load("projects").filter(p => !p.hidden).sort((a, b) => (b.date || "").localeCompare(a.date || ""))
export const experience = load("experience").sort((a, b) => {
  const ka = expSortKey(a), kb = expSortKey(b)
  if (kb.isOngoing !== ka.isOngoing) return kb.isOngoing - ka.isOngoing
  if (kb.ts !== ka.ts) return kb.ts - ka.ts
  return ka.order - kb.order
})
export const skillGroups = load("skills").sort((a, b) => (a.order || 99) - (b.order || 99))

const profileEntry = Object.entries(mdFiles).find(([p]) => p.endsWith("/content/profile.md"))
export const profile = (() => {
  if (!profileEntry) return {}
  const { data, body } = parseMd(profileEntry[1])
  return { ...data, paragraphs: body.split(/\n\n+/).filter(Boolean), photoUrl: data.photo ? resolveImage(data.photo) : "" }
})()
