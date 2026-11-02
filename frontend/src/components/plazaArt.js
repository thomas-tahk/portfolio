import { LAYOUT } from "../constants"

export const DESTINATIONS = {
    projects: { accent: "#ff49b8", core: "#ffe0f3", title: "Projects", subtitle: "Things I build and use" },
    experience: { accent: "#60e6ff", core: "#dcfbff", title: "Experience", subtitle: "IT, games & everything between" },
    skills: { accent: "#ffd567", core: "#fff1c8", title: "Skills", subtitle: "My tools of the trade" },
}

function arc(cx, cy, start) {
    return Array.from({ length: 13 }, (_, i) => {
        const angle = (start + i * 90 / 12) * Math.PI / 180
        return [cx + Math.cos(angle) * 100, cy + Math.sin(angle) * 100]
    })
}

export const LANES = [
    { name: "projects", points: [[0, 0], [-680, 0], ...arc(-680, -100, 90), [-780, -450]] },
    { name: "experience", points: [[0, 0], [680, 0], ...arc(680, -100, 0).reverse(), [780, -350]] },
    { name: "skills", points: [[0, 0], [0, 600], ...arc(100, 600, 90).reverse(), [650, 700]] },
]

const svgURL = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
const pathFor = (points) => points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")

function laneArt({ name, points }) {
    const { accent, core } = DESTINATIONS[name]
    const d = pathFor(points)
    return `<g fill="none" stroke-linejoin="round">
        <path d="${d}" stroke="${accent}" stroke-width="180" opacity=".25" filter="url(#bloom)"/>
        <path d="${d}" stroke="#030713" stroke-width="162"/>
        <path d="${d}" stroke="${accent}" stroke-width="144"/>
        <path d="${d}" stroke="${core}" stroke-width="136"/>
        <path d="${d}" stroke="${accent}" stroke-width="130"/>
        <path d="${d}" stroke="#172139" stroke-width="120"/>
    </g>`
}

function floorArt() {
    const { minX, minY, maxX, maxY } = LAYOUT.map
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX - minX}" height="${maxY - minY}" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}">
        <defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#26324e" stroke-width="1"/></pattern>
        <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="26"/></filter></defs>
        <path d="M${minX} ${minY}H${maxX}V${maxY}H${minX}Z" fill="#0b1125"/>
        <path d="M${minX} ${minY}H${maxX}V${maxY}H${minX}Z" fill="url(#grid)"/>
        ${LANES.map(laneArt).join("")}
        <circle r="142" fill="#121c33" stroke="#c8b0ff" stroke-width="4"/>
        <circle r="115" fill="none" stroke="#eee3ff" stroke-width="3" stroke-dasharray="10 22"/>
    </svg>`
}

function platformArt({ accent, core }) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="460" viewBox="-400 -300 800 460">
        <defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12"/></filter>
        <radialGradient id="spill"><stop stop-color="${accent}" stop-opacity=".3"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
        <ellipse cy="35" rx="395" ry="120" fill="url(#spill)"/>
        <path d="M-300 5H300L275 62H-325Z" fill="#020610" opacity=".9"/>
        <path d="M-290 -15H290L265 28H-315Z" fill="${accent}" stroke="${accent}" stroke-width="10" filter="url(#glow)"/>
        <path d="M-290 -15H290L265 28H-315Z" fill="#1b2137" stroke="${core}" stroke-width="3"/>
        <path d="M-315 28H265V43H-315Z" fill="#050a18"/>
        <path d="M-275 46H235" stroke="${accent}" stroke-width="4"/>
        <rect x="-325" y="-225" width="650" height="145" fill="#040816" transform="translate(0 17)"/>
        <rect x="-325" y="-225" width="650" height="145" fill="none" stroke="${accent}" stroke-width="13" filter="url(#glow)"/>
        <rect x="-325" y="-225" width="650" height="145" fill="#10172d" stroke="${core}" stroke-width="4"/>
    </svg>`
}

function ballArt({ accent, core }) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="-14 -14 128 128">
        <defs><radialGradient id="light"><stop stop-color="${accent}" stop-opacity=".5"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
        <circle cx="50" cy="50" r="64" fill="url(#light)"/>
        <ellipse cx="50" cy="94" rx="40" ry="10" fill="#020610" opacity=".9"/>
        <circle cx="50" cy="50" r="43" fill="${accent}" stroke="${core}" stroke-width="3"/>
        <circle cx="40" cy="34" r="18" fill="white" opacity=".1"/>
    </svg>`
}

export default function loadPlazaArt(k) {
    k.loadSprite("plaza-floor", svgURL(floorArt()))
    Object.entries(DESTINATIONS).forEach(([name, palette]) => {
        k.loadSprite(`${name}-platform`, svgURL(platformArt(palette)))
        k.loadSprite(`${name}-ball`, svgURL(ballArt(palette)))
    })
}
