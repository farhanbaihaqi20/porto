// ALL content is read from Markdown files in src/content/.
// To edit the site, edit those .md files. No component code changes needed.
const mdFiles = import.meta.glob("../content/**/*.md", { query: "?raw", import: "default", eager: true })
const imgFiles = import.meta.glob("../assets/**/*.{webp,jpg,jpeg,png,svg}", { import: "default", eager: true })

function parseValue(v) {
  v = v.trim()
  if (v.startsWith("[") && v.endsWith("]")) {
    // split by comma, but respect commas inside quotes
    const inner = v.slice(1, -1)
    const parts = []
    let cur = "", inQ = false
    for (const ch of inner) {
      if (ch === '"') inQ = !inQ
      if (ch === "," && !inQ) { parts.push(cur); cur = "" } else cur += ch
    }
    if (cur.trim()) parts.push(cur)
    return parts.map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean)
  }
  if (v === "true") return true
  if (v === "false") return false
  if (/^-?\d+$/.test(v)) return Number(v)
  return v.replace(/^"|"$/g, "")
}

function parseMd(raw) {
  // Normalisasi CRLF (Windows / git autocrlf) ke LF dulu.
  // Tanpa ini, clone di Windows membuat semua frontmatter gagal dibaca.
  raw = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw.trim() }
  const data = {}
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":")
    if (i > 0) data[line.slice(0, i).trim()] = parseValue(line.slice(i + 1))
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

export const certificates = load("certificates").sort((a, b) => (b.date || "").localeCompare(a.date || ""))
export const projects = load("projects").filter(p => !p.hidden).sort((a, b) => (b.date || "").localeCompare(a.date || ""))
export const experience = load("experience").sort((a, b) => (a.order || 99) - (b.order || 99))
export const skillGroups = load("skills").sort((a, b) => (a.order || 99) - (b.order || 99))

const profileEntry = Object.entries(mdFiles).find(([p]) => p.endsWith("/content/profile.md"))
export const profile = (() => {
  if (!profileEntry) return {}
  const { data, body } = parseMd(profileEntry[1])
  return { ...data, paragraphs: body.split(/\n\n+/).filter(Boolean), photoUrl: data.photo ? resolveImage(data.photo) : "" }
})()
