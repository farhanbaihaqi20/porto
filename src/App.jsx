import { Navbar, Hero, About, Projects, Certificates, Experience, Contact, Footer, CursorGlow } from "./components"
import { certificates, projects, experience, skillGroups } from "./lib/content"

export default function App() {
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
