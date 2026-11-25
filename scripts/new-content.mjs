#!/usr/bin/env node
// ============================================================
//  npm run new:cert     -> scan raw/certificates/, convert PDF/jpg
//                          halaman 1 jadi WebP (thumb 800 + full 1600),
//                          lalu generate file .md-nya.
//  npm run new:project  -> scan raw/projects/, convert screenshot
//                          jadi WebP, lalu generate file .md-nya.
//  The site NEVER loads PDFs. PDFs are source material in raw/ only.
//  Butuh salah satu converter gambar: cwebp / ImageMagick (magick)
//  dan untuk PDF: pdftoppm (poppler-utils). Kalau belum ada, script
//  still creates the .md and tells you the manual steps.
// ============================================================
import { existsSync, mkdirSync, readdirSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"


if (process.argv[2] === "exp") {
  const name = (process.argv[3] || "new-experience").toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const dir = "src/content/experience"
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, name + ".md")
  if (existsSync(file)) { console.log("Already exists:", file); process.exit(0) }
  writeFileSync(file, `---
role: "New Role"
org: "Organization"
period: "2026"
order: 99
tags: []
---

Describe this experience here.
`)
  console.log("+ Dibuat", file, "- edit that file to change Experience on the site.")
  process.exit(0)
}

const kind = process.argv[2] === "project" ? "project" : "cert"
const isCert = kind === "cert"
const rawDir = isCert ? "raw/certificates" : "raw/projects"
const mdDir = isCert ? "src/content/certificates" : "src/content/projects"
const imgDir = isCert ? "src/assets/certificates" : "src/assets/projects"
for (const d of [rawDir, mdDir, imgDir]) mkdirSync(d, { recursive: true })

const slugify = s => s.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const has = cmd => { try { execFileSync("which", [cmd], { stdio: "ignore" }); return true } catch { return false } }

function toWebp(srcPng, out, width) {
  if (has("cwebp")) { execFileSync("cwebp", ["-quiet", "-q", "82", "-resize", String(width), "0", srcPng, "-o", out]); return true }
  if (has("magick")) { execFileSync("magick", [srcPng, "-resize", width + "x", "-quality", "82", out]); return true }
  if (has("convert")) { execFileSync("convert", [srcPng, "-resize", width + "x", "-quality", "82", out]); return true }
  if (has("python3")) {
    try {
      execFileSync("python3", ["-c", "from PIL import Image; import sys; im = Image.open(sys.argv[1]); w = int(sys.argv[3]); im.resize((w, max(1, round(im.height * w / im.width)))).save(sys.argv[2], 'WEBP', quality=82)", srcPng, out, String(width)])
      return true
    } catch {}
  }
  return false
}

function firstPageImage(file) {
  // Return a temp PNG path of page 1 (PDF) or the file itself (image)
  if (!file.toLowerCase().endsWith(".pdf")) return file
  if (!has("pdftoppm")) { console.log("  ! pdftoppm not found (install: poppler-utils / poppler). PDF skipped, convert it to jpg manually first."); return null }
  const tmp = file.replace(/\.pdf$/i, "-page1")
  execFileSync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "1", file, tmp])
  return tmp + "-1.png"
}

function guessTitle(file) {
  if (file.toLowerCase().endsWith(".pdf") && has("pdftotext")) {
    try {
      const txt = execFileSync("pdftotext", ["-f", "1", "-l", "1", file, "-"], { encoding: "utf8" })
      const line = txt.split("\n").map(s => s.trim()).find(s => s.length > 4)
      if (line) return line
    } catch {}
  }
  return slugify(path.basename(file)).replace(/-/g, " ")
}

const files = existsSync(rawDir) ? readdirSync(rawDir).filter(f => /\.(pdf|png|jpe?g|webp)$/i.test(f)) : []
if (!files.length) {
  console.log(`No new files in ${rawDir}/. Drop a PDF/image there, then run again: npm run new:${kind}`)
  process.exit(0)
}

for (const f of files) {
  const slug = slugify(f)
  const mdPath = path.join(mdDir, slug + ".md")
  if (existsSync(mdPath)) { console.log(`- Skip ${f} (${mdPath} already exists)`); continue }
  const src = path.join(rawDir, f)
  const png = firstPageImage(src)
  let image = "", imageFull = ""
  if (png) {
    const thumb = path.join(imgDir, slug + ".webp")
    const full = path.join(imgDir, slug + "-full.webp")
    if (toWebp(png, thumb, 800) && toWebp(png, full, 1600)) { image = slug + ".webp"; imageFull = slug + "-full.webp" }
    else {
      const fallback = path.join(imgDir, slug + path.extname(png).toLowerCase())
      copyFileSync(png, fallback); image = path.basename(fallback); imageFull = image
      console.log("  ! No image converter found, image copied as-is (not WebP yet).")
    }
    if (png !== src && png.startsWith(rawDir)) try { unlinkSync(png) } catch {}
  }
  const title = guessTitle(src)
  const md = isCert ? `---
title: "${title}"
issuer: "ISSUER_NAME"
date: "2026-01-01"
expiry: ""
category: "Other"
image: "${image}"
imageFull: "${imageFull}"
credentialUrl: ""
note: ""
---

Write a short note about this certificate here (can be left empty).
` : `---
title: "${title}"
date: "2026-01-01"
role: "YOUR_ROLE"
image: "${image}"
liveUrl: ""
repoUrl: ""
featured: false
status: "In Progress"
stack: ["React", "Vite"]
summary: "One-line summary of the project and its value."
problem: "Describe the core problem this project addresses."
solution: "Describe what you built and the technical approach."
highlights: [
  "Key feature or outcome 1",
  "Key feature or outcome 2"
]
---

Optional extra context or implementation notes here.
`
  writeFileSync(mdPath, md)
  console.log(`+ Created ${mdPath}  (image: ${image || "NONE YET, set the image field manually"})`)
}
console.log("\nDone. Edit the new .md file, then run npm run dev to see the result.")
