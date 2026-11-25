import { useEffect, useMemo, useRef, useState } from "react"
import {
  motion, AnimatePresence, useScroll, useSpring, useTransform,
  useMotionValue, useInView, animate
} from "framer-motion"
import {
  Github, Instagram, Linkedin, Mail, MapPin, ArrowUpRight, ArrowRight,
  ExternalLink, Award, X, Check, Copy, Menu, GraduationCap, ShieldCheck,
  Code2, Database, PenTool, ChevronLeft, ChevronRight, CalendarDays,
  Building2, Sparkles, FolderOpen, BadgeCheck, Clock3, Layers
} from "lucide-react"
import { createPortal } from "react-dom"
import { site } from "./config/site"
import { profile } from "./lib/content"
import { useTyping } from "./hooks"

export const fmtDate = s => {
  if (!s) return ""
  const d = new Date(s + "T00:00:00")
  return isNaN(d) ? s : d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] } }),
}
export const viewportOnce = { once: false, margin: "-60px" }

export function SectionHead({ no, title, sub }) {
  return (
    <motion.div className="sec-head" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
      <span className="mono accent sec-no">{no}</span>
      <div>
        <h2>{title.split("").map((ch, i) => <span className="ch" key={i} style={{ "--i": i }}>{ch === " " ? "\u00A0" : ch}</span>)}<span className="accent">.</span></h2>
        {sub && <p>{sub}</p>}
      </div>
      <span className="sec-line" />
    </motion.div>
  )
}

/* ---------- cursor glow (desktop only) ---------- */
export function CursorGlow() {
  const x = useMotionValue(-400), y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 120, damping: 20 }), sy = useSpring(y, { stiffness: 120, damping: 20 })
  useEffect(() => {
    const move = e => { x.set(e.clientX - 250); y.set(e.clientY - 250) }
    window.addEventListener("pointermove", move)
    return () => window.removeEventListener("pointermove", move)
  }, [])
  return <motion.div className="cursor-glow" style={{ x: sx, y: sy }} aria-hidden="true" />
}

/* ---------------- NAVBAR ---------------- */
const NAV = [["about", "About"], ["projects", "Projects"], ["certificates", "Certificates"], ["experience", "Experience"], ["contact", "Contact"]]
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("")
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22 })
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-40% 0px -55% 0px" })
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect() }
  }, [])
  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")}>
      <motion.span className="scroll-progress" style={{ scaleX: progress }} />
      <a className="brand mono" href="#top">farhan<span className="accent">.dev</span></a>
      <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={open ? "open" : ""}>
        {NAV.map(([id, label]) => (
          <a key={id} href={"#" + id} className={active === id ? "active" : ""} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <a className="nav-cta" href={site.socials.github} target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a>
      </nav>
    </header>
  )
}

/* ---------------- HERO ---------------- */
function Counter({ to, suffix = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 1.4, ease: "easeOut", onUpdate: v => setVal(Math.round(v)) })
    return () => c.stop()
  }, [inView, to])
  return <span ref={ref}>{val}{suffix}</span>
}

const MARQUEE = ["React", "Vite", "Supabase", "JavaScript", "Python", "PostgreSQL", "Cisco Networking", "Cyber Security", "PWA", "HCI / UX", "Git & GitHub", "Linux"]

export function Hero({ projectCount, certCount }) {
  const typed = useTyping(site.roles)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const yPhoto = useTransform(scrollYProgress, [0, 1], [0, 60])
  const yText = useTransform(scrollYProgress, [0, 1], [0, 110])
  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero-bg" aria-hidden="true">
        <motion.div className="blob b1" animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="blob b2" animate={{ x: [0, -50, 0], y: [0, 25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <div className="hero-grid-overlay" />
      </div>
      <motion.div className="hero-text" style={{ y: yText }} initial="hidden" animate="show">
        <motion.p className="mono accent hero-kicker" variants={fadeUp} custom={0}>{"// " + (profile.greeting || "Hi, I'm")}</motion.p>
        <motion.h1 variants={fadeUp} custom={1}>{site.name}</motion.h1>
        <motion.p className="typed mono" variants={fadeUp} custom={2}><span>{typed}</span><span className="caret" /></motion.p>
        <motion.p className="hero-bio" variants={fadeUp} custom={3}>{profile.tagline}</motion.p>
        <motion.p className="status" variants={fadeUp} custom={4}><span className="pulse-dot" /> {profile.status || site.status}</motion.p>
        <motion.div className="hero-actions" variants={fadeUp} custom={5}>
          <motion.a className="btn primary" href="#projects" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>View Projects <ArrowRight size={16} /></motion.a>
          {site.cvUrl
            ? <motion.a className="btn ghost" href={site.cvUrl} target="_blank" rel="noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Download CV</motion.a>
            : <motion.a className="btn ghost" href="#contact" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Get in Touch</motion.a>}
        </motion.div>
        <motion.div className="hero-socials" variants={fadeUp} custom={6}>
          <a href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={19} /></a>
          <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={19} /></a>
          <a href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={19} /></a>
          <a href={"mailto:" + site.email} aria-label="Email"><Mail size={19} /></a>
        </motion.div>
        <motion.div className="hero-stats" variants={fadeUp} custom={7}>
          <div className="stat"><strong><Counter to={projectCount} /></strong><span className="mono">Projects shipped</span></div>
          <div className="stat"><strong><Counter to={certCount} /></strong><span className="mono">Certifications</span></div>
          <div className="stat"><strong><Counter to={1} /></strong><span className="mono">Internship</span></div>
        </motion.div>
      </motion.div>
      <motion.div className="hero-photo" style={{ y: yPhoto }} initial={{ opacity: 0, scale: 0.94, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} aria-hidden="true">
        <div className="photo-frame">
          <div className="photo-inner">
            {profile.photoUrl
              ? <><img className="photo-img" src={profile.photoUrl} alt="Portrait of Farhan Baihaqi" /><span className="mono photo-tag on-photo">farhan_baihaqi · semarang, id</span></>
              : <><span className="mono photo-mono">FB</span><span className="mono photo-tag">farhan_baihaqi</span><span className="mono photo-tag dim">semarang, id</span></>}
          </div>
        </div>
        <motion.div className="photo-badge mono" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}><ShieldCheck size={14} /> IT Security</motion.div>
        <motion.div className="photo-badge b2 mono" animate={{ y: [0, 8, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}><Code2 size={14} /> Web Dev</motion.div>
      </motion.div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span className="mono" key={i}>{m}<Sparkles size={12} className="accent" /></span>)}
        </div>
      </div>
    </section>
  )
}

/* ---------------- ABOUT (bento) + SKILLS ---------------- */
const ICONS = { code: Code2, database: Database, shield: ShieldCheck, pen: PenTool }
export function About({ skillGroups }) {
  return (
    <section id="about" className="section">
      <SectionHead no="01" title="About" sub="Edit this whole section in src/content/profile.md and src/content/skills/." />
      <div className="bento">
        <motion.div className="bento-card bio-card" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <p className="mono accent card-label"><FolderOpen size={13} /> BIO</p>
          {(profile.paragraphs || []).map((p, i) => <p key={i} className={i === 0 ? "lead" : ""}>{p}</p>)}
          <p className="mono dim-line"><MapPin size={14} /> {profile.location}</p>
        </motion.div>
        <motion.div className="bento-card now-card" variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <p className="mono accent card-label"><Clock3 size={13} /> NOW</p>
          <h3>{profile.nowTitle}</h3>
          <p>{profile.now}</p>
        </motion.div>
        <motion.div className="bento-card edu-card" variants={fadeUp} custom={2} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <p className="mono accent card-label"><GraduationCap size={13} /> EDUCATION</p>
          <h3>{profile.university}</h3>
          <p>Focus: web development, computer networks, and HCI.</p>
        </motion.div>
        {(profile.highlights || []).map((h, i) => (
          <motion.div className="bento-card highlight-card" variants={fadeUp} custom={3 + i} initial="hidden" whileInView="show" viewport={viewportOnce} key={h}>
            <BadgeCheck size={20} className="accent" />
            <p>{h}</p>
          </motion.div>
        ))}
      </div>
      <div className="skills-grid">
        {skillGroups.map((g, i) => {
          const Icon = ICONS[g.icon] || Code2
          return (
            <motion.div className="skill-card spotlight" variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={viewportOnce} key={g.slug}
              onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--mx", (e.clientX - r.left) + "px"); e.currentTarget.style.setProperty("--my", (e.clientY - r.top) + "px") }}>
              <h3><Icon size={17} className="accent" /> {g.title}</h3>
              <div className="chips">{(g.items || []).map(s => <span className="chip mono" key={s}>{s}</span>)}</div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
/* ---------------- PROJECTS + DETAIL MODAL ---------------- */
function useSpotlight(e) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty("--mx", (e.clientX - r.left) + "px")
  e.currentTarget.style.setProperty("--my", (e.clientY - r.top) + "px")
}
function Tilt({ children, className, onClick }) {
  const ref = useRef(null)
  const move = e => {
    useSpotlight(e)
    const el = ref.current
    if (!el || e.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`
  }
  const leave = () => { if (ref.current) ref.current.style.transform = "" }
  return <motion.article ref={ref} className={className} onPointerMove={move} onPointerLeave={leave} onClick={onClick}>{children}</motion.article>
}

export function Projects({ projects }) {
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    const esc = e => e.key === "Escape" && setSelected(null)
    window.addEventListener("keydown", esc)
    document.body.style.overflow = selected ? "hidden" : ""
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = "" }
  }, [selected])
  const featured = projects.filter(p => p.featured)
  const rest = projects.filter(p => !p.featured)
  const card = (p, i, cls) => (
    <Tilt className={"proj-card spotlight " + cls} key={p.slug} onClick={() => setSelected(p)}>
      <motion.div variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={viewportOnce} className="proj-motion">
        <div className="proj-img"><motion.img src={p.imageUrl} alt={"Screenshot of " + p.title} loading="lazy" layoutId={"proj-img-" + p.slug} />
          {cls.includes("featured") && <span className="proj-badge mono">FEATURED</span>}
          <span className="proj-date mono">{fmtDate(p.date)}</span>
        </div>
        <div className="proj-info">
          {cls.includes("featured") && <span className="proj-index mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
          <p className="mono dim-line">{p.role} · {fmtDate(p.date)}</p>
          <h3>{p.title}</h3>
          <p className="proj-desc">{(p.paragraphs || [])[0]}</p>
          <div className="chips">{(p.stack || []).map(s => <span className="chip mono" key={s}>{s}</span>)}</div>
          <span className="view-detail mono">Click to view full project <ArrowUpRight size={14} /></span>
        </div>
      </motion.div>
    </Tilt>
  )
  return (
    <section id="projects" className="section">
      <SectionHead no="02" title="Projects" sub="Click any project to open the full case view: story, stack, and links." />
      <div className="featured-list">{featured.map((p, i) => card(p, i, "featured" + (i % 2 ? " flip" : "")))}</div>
      <div className="proj-grid">{rest.map((p, i) => card(p, i, ""))}</div>

      {createPortal(
      <AnimatePresence>
        {selected && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="project-modal" initial={{ opacity: 0, y: 46, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>
              <div className="pm-hero"><motion.img src={selected.imageUrl} alt={"Screenshot of " + selected.title} layoutId={"proj-img-" + selected.slug} /></div>
              <div className="pm-body">
                <p className="mono accent">{selected.role}</p>
                <h3>{selected.title}</h3>
                <div className="pm-meta">
                  <div><span className="mono"><CalendarDays size={13} /> DATE</span><strong>{fmtDate(selected.date)}</strong></div>
                  <div><span className="mono"><Layers size={13} /> STACK</span><strong>{(selected.stack || []).join(", ")}</strong></div>
                  <div><span className="mono"><BadgeCheck size={13} /> STATUS</span><strong>Live & shipped</strong></div>
                </div>
                {(selected.paragraphs || []).map((para, i) => <p key={i}>{para}</p>)}
                <div className="pm-actions">
                  {selected.liveUrl && <motion.a className="btn primary" href={selected.liveUrl} target="_blank" rel="noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Visit Live Site <ExternalLink size={15} /></motion.a>}
                  {selected.repoUrl && <motion.a className="btn ghost" href={selected.repoUrl} target="_blank" rel="noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}><Github size={15} /> View Code</motion.a>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </section>
  )
}

/* ---------------- CERTIFICATES + FULL VIEWER ---------------- */
export function Certificates({ certificates }) {
  const cats = useMemo(() => ["All", ...new Set(certificates.map(c => c.category).filter(Boolean))], [certificates])
  const [cat, setCat] = useState("All")
  const [idx, setIdx] = useState(null)
  const shown = cat === "All" ? certificates : certificates.filter(c => c.category === cat)
  const selected = idx !== null ? shown[idx] : null
  const step = d => setIdx(v => (v + d + shown.length) % shown.length)
  useEffect(() => {
    const onKey = e => {
      if (idx === null) return
      if (e.key === "Escape") setIdx(null)
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = idx !== null ? "hidden" : ""
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = "" }
  }, [idx, shown.length])
  return (
    <section id="certificates" className="section">
      <SectionHead no="03" title="Certificates" sub="Served as lightweight WebP images, never PDFs, so the page stays fast. Click one to open the full viewer." />
      <div className="filters">
        {cats.map(c => (
          <button key={c} className={"filter-btn mono" + (cat === c ? " active" : "")} onClick={() => { setCat(c); setIdx(null) }}>
            {cat === c && <motion.span className="filter-pill" layoutId="filter-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span>{c}</span>
          </button>
        ))}
      </div>
      <motion.div className="cert-grid" layout>
        <AnimatePresence mode="popLayout">
          {shown.map((c, i) => (
            <motion.button className="cert-card spotlight" key={c.slug} layout initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ duration: 0.35, delay: i * 0.05 }} onPointerMove={useSpotlight} onClick={() => setIdx(i)}>
              <div className="cert-img"><img src={c.imageUrl} alt={"Certificate: " + c.title} loading="lazy" /></div>
              <div className="cert-info">
                <p className="mono dim-line"><Award size={13} /> {c.issuer}</p>
                <h3>{c.title}</h3>
                <p className="mono dim-line">{fmtDate(c.date)}{c.expiry ? " · valid until " + fmtDate(c.expiry) : ""}</p>
                <span className="view-detail mono">Open full view <ArrowUpRight size={13} /></span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {createPortal(
      <AnimatePresence>
        {selected && (
          <motion.div className="cert-viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true">
            <div className="cv-toolbar">
              <span className="mono">{String(idx + 1).padStart(2, "0")} / {String(shown.length).padStart(2, "0")}</span>
              <div className="cv-nav">
                <button onClick={() => step(-1)} aria-label="Previous certificate"><ChevronLeft size={19} /></button>
                <button onClick={() => step(1)} aria-label="Next certificate"><ChevronRight size={19} /></button>
                <button onClick={() => setIdx(null)} aria-label="Close"><X size={19} /></button>
              </div>
            </div>
            <div className="cv-main">
              <AnimatePresence mode="wait">
                <motion.img key={selected.slug} src={selected.imageFullUrl || selected.imageUrl} alt={"Certificate: " + selected.title}
                  initial={{ opacity: 0, x: 60, rotateY: 6 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -60, rotateY: -6 }} transition={{ duration: 0.35 }} className="cv-img" />
              </AnimatePresence>
              <motion.aside className="cv-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <span className="cv-badge mono"><Award size={13} /> {selected.category}</span>
                <h3>{selected.title}</h3>
                <div className="cv-rows">
                  <p><Building2 size={15} className="accent" /><span><small className="mono">ISSUER</small>{selected.issuer}</span></p>
                  <p><CalendarDays size={15} className="accent" /><span><small className="mono">ISSUED</small>{fmtDate(selected.date)}</span></p>
                  {selected.expiry && <p><BadgeCheck size={15} className="accent" /><span><small className="mono">VALID UNTIL</small>{fmtDate(selected.expiry)}</span></p>}
                </div>
                {selected.note && <p className="cv-note">{selected.note}</p>}
                {selected.body && <p className="cv-body">{selected.body}</p>}
                {selected.credentialUrl
                  ? <a className="btn primary" href={selected.credentialUrl} target="_blank" rel="noreferrer">Verify Credential <ExternalLink size={15} /></a>
                  : <p className="mono dim-line">Credential link: add it in the certificate .md file</p>}
                <div className="cv-thumbs">
                  {shown.map((c, i) => (
                    <button key={c.slug} className={i === idx ? "active" : ""} onClick={() => setIdx(i)} aria-label={c.title}>
                      <img src={c.imageUrl} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </motion.aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </section>
  )
}

/* ---------------- EXPERIENCE (animated timeline) ---------------- */
export function Experience({ experience }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] })
  const lineScale = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  return (
    <section id="experience" className="section">
      <SectionHead no="04" title="Experience" sub="Edit these in src/content/experience/, one file per entry." />
      <div className="timeline" ref={ref}>
        <motion.span className="tl-progress" style={{ scaleY: lineScale }} />
        {experience.map((x, i) => (
          <motion.div className={"tl-item" + (i % 2 ? " right" : "")} key={x.slug}
            initial={{ opacity: 0, x: i % 2 ? 44 : -44 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportOnce} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <motion.span className="tl-dot" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={viewportOnce} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.15 }} />
            <div className="tl-card spotlight" onPointerMove={useSpotlight}>
              <p className="mono accent tl-date">{x.period}</p>
              <h3>{x.role}</h3>
              <p className="mono dim-line">{x.org}</p>
              <p>{x.body}</p>
              <div className="chips">{(x.tags || []).map(t => <span className="chip mono" key={t}>{t}</span>)}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- CONTACT ---------------- */
export function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(site.email); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  const lastSeg = (u) => (u || "").replace(/\/+$/, "").split("/").pop() || ""
  const cards = [
    { icon: Instagram, label: "Instagram", value: "@" + lastSeg(site.socials.instagram), href: site.socials.instagram, hint: "Open profile" },
    { icon: Linkedin, label: "LinkedIn", value: "in/" + lastSeg(site.socials.linkedin), href: site.socials.linkedin, hint: "Open profile" },
    { icon: Github, label: "GitHub", value: lastSeg(site.socials.github), href: site.socials.github, hint: "Open profile" },
  ]
  return (
    <section id="contact" className="section">
      <SectionHead no="05" title="Contact" />
      <motion.h3 className="contact-big" variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
        Let&apos;s build something<br />worth <span className="accent-grad">shipping.</span>
      </motion.h3>
      <p className="contact-sub">Open to internships, projects, and collaborations. The fastest way to reach me is email or LinkedIn.</p>
      <div className="contact-grid">
        <motion.div className="contact-card spotlight" variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={viewportOnce} onPointerMove={useSpotlight}>
          <Mail size={21} className="accent" />
          <h3>Email</h3>
          <p className="mono mail-value">{site.email}</p>
          <button className="btn ghost small" onClick={copy}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Email</>}</button>
        </motion.div>
        {cards.map((c, i) => (
          <motion.a className="contact-card spotlight" variants={fadeUp} custom={i + 1} initial="hidden" whileInView="show" viewport={viewportOnce} onPointerMove={useSpotlight} key={c.label} href={c.href} target="_blank" rel="noreferrer">
            <c.icon size={21} className="accent" />
            <h3>{c.label}</h3>
            <p className="mono">{c.value}</p>
            <span className="contact-go mono">{c.hint} <ChevronRight size={13} /></span>
          </motion.a>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer>
      <p className="mono">© {new Date().getFullYear()} {site.name} · Semarang</p>
      <div className="hero-socials">
        <a href={site.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a>
        <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
        <a href={site.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
        <a href={"mailto:" + site.email} aria-label="Email"><Mail size={17} /></a>
      </div>
      <p className="mono dim-line"><GraduationCap size={13} /> {site.university}</p>
    </footer>
  )
}
