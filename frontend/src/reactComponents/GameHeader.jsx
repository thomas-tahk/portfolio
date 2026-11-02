import content from "../content.json"
import PlainPageLink from "./PlainPageLink"

export default function GameHeader() {
    return (
        <header className="game-header">
            <div className="game-identity">
                <strong>{content.about.name}</strong>
                <p>{content.headline}</p>
            </div>
            <nav aria-label="Contact and plain portfolio">
                <a href={content.contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href={content.contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href={`mailto:${content.contact.email}`}>Email</a>
                <PlainPageLink />
            </nav>
        </header>
    )
}
