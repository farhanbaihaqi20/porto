import { useEffect, useRef, useState } from "react"

// Animasi muncul saat elemen masuk layar (scroll reveal)
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll(".reveal")
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } })
    }, { threshold: 0.12 })
    items.forEach(i => io.observe(i))
    return () => io.disconnect()
  }, [])
  return ref
}

// Efek mengetik bergantian (typing)
export function useTyping(words, speed = 75, pause = 1600) {
  const [text, setText] = useState("")
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setText(words[0]); return }
    let w = 0, i = 0, del = false, t
    const tick = () => {
      const word = words[w]
      setText(word.slice(0, i))
      let wait = del ? 38 : speed
      if (!del && i === word.length) { wait = pause; del = true }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; wait = 350 }
      i += del ? -1 : 1
      t = setTimeout(tick, wait)
    }
    t = setTimeout(tick, 300)
    return () => clearTimeout(t)
  }, [])
  return text
}
