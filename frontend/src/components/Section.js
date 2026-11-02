import { LAYOUT } from "../constants"
import { DESTINATIONS } from "./plazaArt"

export default function makeSection(k, { name, onEnter }) {
    const position = LAYOUT.sections[name]
    const palette = DESTINATIONS[name]
    const section = k.add([
        k.pos(position.x, position.y), k.z(-1),
        k.area({ shape: new k.Rect(k.vec2(-LAYOUT.sectionSize / 2, -110), LAYOUT.sectionSize, 220) }),
        name,
    ])
    section.add([k.sprite(`${name}-platform`), k.anchor("center"), k.pos(0, -70)])
    const title = section.add([k.text(palette.title, { font: "ibm-bold", size: 52 }),
        k.anchor("center"), k.pos(0, -170), k.color(k.Color.fromHex(palette.core))])
    const subtitle = section.add([k.text(palette.subtitle, { font: "ibm-regular", size: 23 }),
        k.anchor("center"), k.pos(0, -118), k.color(k.Color.fromHex("#bbc7e1"))])
    section.onUpdate(() => {
        const size = Math.max(52, 13 / k.camScale().x)
        if (title.textSize !== size) title.textSize = size
        subtitle.hidden = k.camScale().x < 0.25
    })
    section.onCollide("player", onEnter)
    return section
}
