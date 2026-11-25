# Farhan Baihaqi - Portfolio

One-page portfolio: projects, certificates, experience, and contact.
React + Vite + Framer Motion, no backend. **All content lives in Markdown
files in `src/content/`** - nothing about you is hardcoded in components.

## Run it

```bash
npm install
npm run dev
```

## How to edit your content (no coding)

| What you want to change | File to edit |
| --- | --- |
| Bio / About text, tagline, status, "now" card, highlights | `src/content/profile.md` |
| Skills | `src/content/skills/*.md` (one file per group) |
| Experience / timeline | `src/content/experience/*.md` (one file per entry) |
| A project | `src/content/projects/*.md` |
| A certificate | `src/content/certificates/*.md` |
| Email, Instagram, LinkedIn, CV link | `src/config/site.js` (one place) |

Save the file and the dev server updates instantly. That is all.

### Add a new experience entry

```bash
npm run new:exp my-new-role
```

Then edit the generated file in `src/content/experience/`
(`role`, `org`, `period`, `order` = sort position, `tags`, and the text).

### Add a new certificate (no coding)

1. Drop the PDF/JPG into `raw/certificates/`
2. Run `npm run new:cert`

The script converts page 1 of the PDF into WebP images (800px thumbnail
+ 1600px full view), because the site only ever loads WebP, never PDFs,
then creates the `.md` file for it.
3. Edit that `.md`: fix `title`, `issuer`, `date`, `category`
   (AI / Networking / Security / Other), and `credentialUrl` if the
   issuer has a public verification page.

Converter requirements: `poppler-utils` (pdftoppm, pdftotext) and one of
`webp` (cwebp), ImageMagick, or Python Pillow. On WSL Ubuntu:

```bash
sudo apt install poppler-utils webp
```

### Add a new project

Drop a screenshot into `raw/projects/`, run `npm run new:project`,
then edit the `.md` in `src/content/projects/`
(`liveUrl`, `repoUrl`, `stack`). Layout: `featured: true` shows the project as a big card at the top, `featured: false` shows it as a normal grid card below it (it does NOT hide the project). To hide a project from the site completely, add `hidden: true`.

## Instagram & LinkedIn

Edit `src/config/site.js`, section `socials`, replace `YOUR_USERNAME`.
The hero, Contact section, and footer all update from that one place.

## Deploy

Push this repo to GitHub, connect it to Vercel (framework: Vite,
auto-detected), and every push auto-deploys.

Future revisions: `git pull` after a revision is pushed, then
`npm run dev` again. No zip files needed.

## Placeholder images

The certificate and project images currently in `src/assets/` are SVG
PLACEHOLDERS (yellow banner). Replace them with real files through the
`npm run new:cert` / `new:project` flow above, or overwrite the files
in `src/assets/certificates/` and `src/assets/projects/` using the
exact same filenames.

## Change the hero photo

1. Put your photo file in `src/assets/` (JPG/PNG/WebP, portrait orientation works best), e.g. `src/assets/photo.jpg`.
2. In `src/content/profile.md`, set `photo: "photo.jpg"` (just the file name).
3. Commit and push the photo file with git (image files are binary, so they must go through a normal `git push`, not the web editor). Leave `photo: ""` to keep the FB monogram placeholder.
