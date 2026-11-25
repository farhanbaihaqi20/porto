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
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs"
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
date: "2026-01-01"
label: "Work & Projects"
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
const isWin = process.platform === "win32"
const has = cmd => {
  try {
    execFileSync(isWin ? "where.exe" : "which", [cmd], { stdio: "ignore" })
    return true
  } catch { return false }
}
const getPython = () => ["python3", "python"].find(has) || null

function toWebp(srcPng, out, width) {
  if (has("cwebp")) { execFileSync("cwebp", ["-quiet", "-q", "82", "-resize", String(width), "0", srcPng, "-o", out]); return true }
  if (has("magick")) { execFileSync("magick", [srcPng, "-resize", width + "x", "-quality", "82", out]); return true }
  if (!isWin && has("convert")) { execFileSync("convert", [srcPng, "-resize", width + "x", "-quality", "82", out]); return true }
  if (has("ffmpeg")) {
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", srcPng, "-vf", `scale=${width}:-1`, "-c:v", "libwebp", "-quality", "82", out], { stdio: "ignore" })
      return true
    } catch {}
  }
  const py = getPython()
  if (py) {
    try {
      execFileSync(py, ["-c", "from PIL import Image; import sys; im = Image.open(sys.argv[1]); w = int(sys.argv[3]); im.resize((w, max(1, round(im.height * w / im.width)))).save(sys.argv[2], 'WEBP', quality=82)", srcPng, out, String(width)], { stdio: "ignore" })
      return true
    } catch {}
  }
  return false
}

function firstPageImage(file) {
  // Return a temp PNG path of page 1 (PDF) or the file itself (image)
  if (!file.toLowerCase().endsWith(".pdf")) return file
  const tmpPng = file.replace(/\.pdf$/i, "-page1-1.png")
  if (has("pdftoppm")) {
    const tmp = file.replace(/\.pdf$/i, "-page1")
    execFileSync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "1", file, tmp])
    return tmp + "-1.png"
  }
  const py = getPython()
  if (py) {
    try {
      execFileSync(py, ["-c", "import pymupdf, sys; doc = pymupdf.open(sys.argv[1]); doc[0].get_pixmap(dpi=200).save(sys.argv[2])", file, tmpPng], { stdio: "ignore" })
      if (existsSync(tmpPng)) return tmpPng
    } catch {}
  }
  console.log("  ! No PDF renderer found (need pdftoppm or python pymupdf). PDF skipped, convert it to jpg manually first.")
  return null
}

function guessTitle(file) {
  if (file.toLowerCase().endsWith(".pdf")) {
    if (has("pdftotext")) {
      try {
        const txt = execFileSync("pdftotext", ["-f", "1", "-l", "1", file, "-"], { encoding: "utf8" })
        const line = txt.split("\n").map(s => s.trim()).find(s => s.length > 4)
        if (line) return line
      } catch {}
    }
    const py = getPython()
    if (py) {
      try {
        const txt = execFileSync(py, ["-c", "import pymupdf, sys; print(pymupdf.open(sys.argv[1])[0].get_text())", file], { encoding: "utf8" })
        const line = txt.split("\n").map(s => s.trim()).find(s => s.length > 4)
        if (line) return line
      } catch {}
    }
  }
  return slugify(path.basename(file)).replace(/-/g, " ")
}

function generateImages(src, slug) {
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
    if (png !== src && path.resolve(png).startsWith(path.resolve(rawDir) + path.sep)) try { unlinkSync(png) } catch {}
  }
  return { image, imageFull }
}

const files = existsSync(rawDir) ? readdirSync(rawDir).filter(f => /\.(pdf|png|jpe?g|webp)$/i.test(f)) : []
if (!files.length) {
  console.log(`No new files in ${rawDir}/. Drop a PDF/image there, then run again: npm run new:${kind}`)
  process.exit(0)
}

for (const f of files) {
  const slug = slugify(f)
  const mdPath = path.join(mdDir, slug + ".md")
  const src = path.join(rawDir, f)
  if (existsSync(mdPath)) {
    const existing = readFileSync(mdPath, "utf8")
    const missingImg = /^image:\s*["']?\s*["']?\s*$/m.test(existing)
    if (!missingImg) { console.log(`- Skip ${f} (${mdPath} already exists)`); continue }
    const { image, imageFull } = generateImages(src, slug)
    if (image) {
      let updated = existing.replace(/^image:\s*["']?\s*["']?\s*$/m, `image: "${image}"`)
      if (isCert) updated = updated.replace(/^imageFull:\s*["']?\s*["']?\s*$/m, `imageFull: "${imageFull}"`)
      writeFileSync(mdPath, updated)
      console.log(`+ Updated ${mdPath}  (image: ${image})`)
    } else {
      console.log(`- Skip ${f} (${mdPath} exists, still could not generate image)`)
    }
    continue
  }
  const { image, imageFull } = generateImages(src, slug)
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
