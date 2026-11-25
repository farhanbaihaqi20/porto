import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar, Hero, About, Projects, Certificates, Experience, Contact, Footer, CursorGlow } from "./components"
import { certificates, projects, experience, skillGroups } from "./lib/content"

const LABELS = { top: "HOME", about: "ABOUT", projects: "PROJECTS", certificates: "CERTIFICATES", experience: "EXPERIENCE", contact: "CONTACT" }

// Klik menu: panel wipe menyapu layar (dengan label section di tengahnya),
// halaman berpindah di balik sapuan, lalu panel membuka di section tujuan
// yang mendapat kelas "landing" -> animasi mendarat khas tiap section.
function useWipeAnchors() {
  const [wipe, setWipe] = useState(null)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute("href").slice(1)
      const el = id ? document.getElementById(id) : null
      if (!el) return
      e.preventDefault()
      const target = id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 80
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, target)
        history.replaceState(null, "", "#" + id)
        return
      }
      setWipe({ label: LABELS[id] || id.toUpperCase(), key: Date.now() })
      setTimeout(() => {
        window.scrollTo(0, target)
        history.replaceState(null, "", "#" + id)
        el.classList.remove("landing"); void el.offsetWidth; el.classList.add("landing")
        setTimeout(() => el.classList.remove("landing"), 1800)
      }, 460)
      setTimeout(() => setWipe(null), 1180)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
  return wipe
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
  const wipe = useWipeAnchors()
  return (
    <div>
      <CursorGlow />
      <Navbar />
      <main>
        <Hero projectCount={projects.length} certCount={certificates.length} />
        <About skillGroups={skillGroups} />
        <Projects projects={projects} />
        <Certificates certificates={certificates} />
        <Experience experience={experience} />
        <Contact />
      </main>
      <Footer />
      <NavWipe wipe={wipe} />
    </div>
  )
}
