import { useEffect } from "react"
import { animate } from "framer-motion"
import { Navbar, Hero, About, Projects, Certificates, Experience, Contact, Footer, CursorGlow } from "./components"
import { certificates, projects, experience, skillGroups } from "./lib/content"

// Klik menu / tombol anchor: scroll digerakkan Framer Motion dengan easing
// easeOutExpo (meluncur cepat lalu mendarat lembut), bukan smooth bawaan browser.
// Section tujuan diberi kilau "nav-flash" sesaat supaya terasa ada motion-nya.
function useAnimatedAnchors() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute("href").slice(1)
      const el = id ? document.getElementById(id) : null
      if (!el) return
      e.preventDefault()
      const target = id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 80
      el.classList.remove("nav-flash"); void el.offsetWidth; el.classList.add("nav-flash")
      setTimeout(() => el.classList.remove("nav-flash"), 1500)
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, target); return
      }
      animate(window.scrollY, target, {
        duration: 1.15, ease: [0.22, 1, 0.36, 1],
        onUpdate: v => window.scrollTo(0, v),
        onComplete: () => history.replaceState(null, "", "#" + id),
      })
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
}

export default function App() {
  useAnimatedAnchors()
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
    </div>
  )
}
