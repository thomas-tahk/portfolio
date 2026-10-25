import { useState } from 'react'
import content from '../content.json'
import RecentWork from './RecentWork'
import ThemeToggle from './ThemeToggle'

const BASE = import.meta.env.BASE_URL
const visibleProjects = content.projects.filter((p) => !p.hidden)
const featured = visibleProjects.filter((p) => p.tier === 'featured')
const more = visibleProjects.filter((p) => p.tier === 'more')

function LinkButtons({ project }) {
  if (project.links.length === 0) return null
  return (
    <p className="buttons">
      {project.links.map((l) => (
        <a key={l.url} className="btn" href={l.url} aria-label={`${project.name}: ${l.label}`}>
          {l.label}
        </a>
      ))}
    </p>
  )
}

function ProjectItem({ project, className }) {
  return (
    <li className={className}>
      <h3>{project.name}</h3>
      <p>{project.oneLiner}</p>
      {project.image && (
        <img
          className="shot"
          src={`${BASE}${project.image}`}
          alt={`Placeholder for a ${project.name} screenshot, coming soon`}
          width="640"
          height="360"
          loading="lazy"
        />
      )}
      <LinkButtons project={project} />
    </li>
  )
}

function Experience() {
  return (
    <section aria-labelledby="experience-h">
      <h2 id="experience-h">Experience</h2>
      <ul className="plain-list">
        {content.experience.map((e) => (
          <li key={e.company + e.position}>
            <h3>{e.position}</h3>
            <p className="meta">
              {e.company} · {e.duration}
            </p>
            <p>{e.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CopyEmail({ email }) {
  const [status, setStatus] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setStatus('Email copied to clipboard.')
    } catch {
      setStatus('Could not copy. Select the address above instead.')
    }
  }
  return (
    <>
      <button type="button" className="btn solid" onClick={copy}>
        Copy email
      </button>
      <span role="status" className="copy-status">
        {status}
      </span>
    </>
  )
}

function Contact() {
  const { email, github, linkedin } = content.contact
  return (
    <section aria-labelledby="contact-h">
      <h2 id="contact-h">Contact</h2>
      <p>
        <a href={`mailto:${email}`}>{email}</a>
      </p>
      <p className="buttons">
        <CopyEmail email={email} />
        <a className="btn" href={github}>
          GitHub
        </a>
        <a className="btn" href={linkedin}>
          LinkedIn
        </a>
      </p>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <main id="main">
        <header>
          <ThemeToggle />
          <h1>{content.about.name}</h1>
          <p className="headline">{content.headline}</p>
        </header>

        <section aria-labelledby="about-h" className="about">
          <h2 id="about-h">About</h2>
          <img
            src={`${BASE}headshot-small.jpg`}
            alt={`Portrait of ${content.about.name}`}
            width="120"
            height="180"
          />
          <p>{content.about.text}</p>
        </section>

        <section aria-labelledby="featured-h">
          <h2 id="featured-h">Featured projects</h2>
          <ul className="plain-list">
            {featured.map((p) => (
              <ProjectItem key={p.slug} project={p} className="card" />
            ))}
          </ul>
        </section>

        <section aria-labelledby="more-h">
          <h2 id="more-h">More work</h2>
          <ul className="plain-list">
            {more.map((p) => (
              <ProjectItem key={p.slug} project={p} className="more-item" />
            ))}
          </ul>
        </section>

        <RecentWork />

        <Experience />
        <Contact />

        <p className="game-link">
          <a className="btn solid" href={`${BASE}play/`}>
            Play the game version →
          </a>
        </p>
      </main>
    </>
  )
}
