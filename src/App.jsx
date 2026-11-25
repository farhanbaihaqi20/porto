import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar, Hero, Home, About, Projects, Certificates, Experience, Contact, Footer, CursorGlow } from "./components"
import { certificates, projects, experience, skillGroups } from "./lib/content"

// Model A+B: gerbang intro dulu, lalu isi per halaman (bukan satu scroll panjang).
// Halaman: top (Home/hero), about, projects, certificates, experience, contact.
// Hash URL mengikuti halaman (#projects dll) supaya bisa dibagikan & tombol Back jalan.
const VIEWS = ["top", "about", "projects", "certificates", "experience", "contact"]
const LABELS = { top: "HOME", about: "ABOUT", projects: "PROJECTS", certificates: "CERTIFICATES", experience: "EXPERIENCE", contact: "CONTACT" }
const store = {
  get() { try { return sessionStorage.getItem("porto-explored") === "1" } catch { return false } },
  set() { try { sessionStorage.setItem("porto-explored", "1") } catch {} },
  clear() { try { sessionStorage.removeItem("porto-explored") } catch {} },
}
const hashView = () => {
  const h = (window.location.hash || "").replace("#", "")
  return VIEWS.includes(h) ? h : null
}

function NavWipe({ wipe }) {
  return createPortal(
    <AnimatePresence>
      {wipe && (
        <div className="wipe-wrap" key={wipe.key} aria-hidden="true">
          <motion.div className="wipe-panel back"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)", "inset(0 0 0% 0)", "inset(100% 0 0 0)"] }}
            transition={{ duration: 1.1, times: [0, 0.38, 0.58, 1], ease: [0.83, 0, 0.17, 1] }} />
          <motion.div className="wipe-panel front"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)", "inset(0 0 0% 0)", "inset(100% 0 0 0)"] }}
            transition={{ duration: 1.1, times: [0, 0.38, 0.58, 1], ease: [0.83, 0, 0.17, 1], delay: 0.07 }}>
            <motion.span className="wipe-label mono"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: [0, 0, 1, 1, 0], y: [16, 16, 0, 0, -12] }}
              transition={{ duration: 1.1, times: [0, 0.3, 0.45, 0.62, 0.8], ease: "easeOut" }}>
              {wipe.label}
            </motion.span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body)
}

export default function App() {
  const [phase, setPhase] = useState(() => (hashView() && hashView() !== "top") || store.get() ? "app" : "intro")
  const [view, setView] = useState(() => hashView() || "top")
  const [wipe, setWipe] = useState(null)
  const viewRef = useRef(view); viewRef.current = view
  const phaseRef = useRef(phase); phaseRef.current = phase
  const busyRef = useRef(false)
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const land = (id) => {
    setTimeout(() => {
      const el = document.getElementById(id)
      if (!el) return
      el.classList.remove("landing"); void el.offsetWidth; el.classList.add("landing")
      setTimeout(() => el.classList.remove("landing"), 1800)
    }, 60)
  }

  const goView = (id, push = true) => {
    if (!VIEWS.includes(id)) return
    if (id === viewRef.current) { window.scrollTo(0, 0); return }
    if (busyRef.current) return
    if (push) history.pushState(null, "", "#" + id)
    if (reduced()) { setView(id); window.scrollTo(0, 0); land(id); return }
    busyRef.current = true
    setWipe({ label: LABELS[id], key: Date.now() })
    setTimeout(() => { setView(id); window.scrollTo(0, 0); land(id) }, 460)
    setTimeout(() => { setWipe(null); busyRef.current = false }, 1180)
  }

  const explore = () => {
    store.set()
    if (reduced()) { setPhase("app"); setView("top"); window.scrollTo(0, 0); return }
    busyRef.current = true
    setWipe({ label: "EXPLORE", key: Date.now() })
    setTimeout(() => { setPhase("app"); setView("top"); window.scrollTo(0, 0); history.replaceState(null, "", "#top") }, 460)
    setTimeout(() => { setWipe(null); busyRef.current = false }, 1180)
  }

  const replay = () => {
    store.clear()
    history.pushState(null, "", window.location.pathname + window.location.search)
    setView("top"); setPhase("intro"); window.scrollTo(0, 0)
  }

  // Kunci scroll selama intro
  useEffect(() => {
    document.body.style.overflow = phase === "intro" ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [phase])

  // Deep link: mendarat langsung dengan animasi landing
  useEffect(() => { if (phase === "app" && view !== "top") land(view) }, []) // eslint-disable-line

  // Semua link anchor internal = ganti halaman (bukan scroll)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || phaseRef.current !== "app") return
      const id = a.getAttribute("href").slice(1)
      if (!VIEWS.includes(id)) return
      e.preventDefault()
      goView(id)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, []) // eslint-disable-line

  // Tombol Back / Forward browser
  useEffect(() => {
    const onHash = () => {
      if (phaseRef.current !== "app") return
      const id = hashView() || "top"
      if (id !== viewRef.current) { setView(id); window.scrollTo(0, 0); land(id) }
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, []) // eslint-disable-line

  if (phase === "intro") {
    return (
      <div>
        <CursorGlow />
        <header className="nav intro-nav">
          <span className="brand mono">farhan<span className="accent">.dev</span></span>
        </header>
        <main>
          <Hero projectCount={projects.length} certCount={certificates.length} mode="intro" onExplore={explore} />
        </main>
        <NavWipe wipe={wipe} />
      </div>
    )
  }

  return (
    <div>
      <CursorGlow />
      <Navbar active={view} />
      <main className="view-wrap">
        {view === "top" && <Home projects={projects} certificates={certificates} experience={experience} />}
        {view === "about" && <About skillGroups={skillGroups} />}
        {view === "projects" && <Projects projects={projects} />}
        {view === "certificates" && <Certificates certificates={certificates} />}
        {view === "experience" && <Experience experience={experience} />}
        {view === "contact" && <Contact />}
      </main>
      <Footer onReplay={replay} />
      <NavWipe wipe={wipe} />
    </div>
  )
}
