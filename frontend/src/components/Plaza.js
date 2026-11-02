import { LAYOUT } from "../constants"
import { LANES, DESTINATIONS } from "./plazaArt"

function laneSegments(k, lane) {
    return lane.points.slice(1).map((point, i) => {
        const start = k.vec2(...lane.points[i])
        const end = k.vec2(...point)
        return { start, end, length: end.dist(start) }
    })
}

function drawMarkings(k, segments, color, offset) {
    let travelled = 0
    for (const segment of segments) {
        for (let start = ((offset - travelled) % 72 + 72) % 72 - 72; start < segment.length; start += 72) {
            const from = Math.max(0, start)
            const to = Math.min(segment.length, start + 25)
            if (to <= from) continue
            k.drawLine({ p1: segment.start.lerp(segment.end, from / segment.length),
                p2: segment.start.lerp(segment.end, to / segment.length), width: 5, color })
        }
        travelled += segment.length
    }
}

export default function makePlaza(k) {
    k.add([k.sprite("plaza-floor"), k.pos(LAYOUT.map.minX, LAYOUT.map.minY), k.z(-20)])
    const lanes = LANES.map((lane) => ({ segments: laneSegments(k, lane), color: k.Color.fromHex(DESTINATIONS[lane.name].core) }))
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    k.add([k.pos(0), k.z(-10), { draw() {
        const offset = reducedMotion.matches ? 0 : k.time() * 40 % 72
        lanes.forEach(({ segments, color }) => drawMarkings(k, segments, color, offset))
    } }])
}
