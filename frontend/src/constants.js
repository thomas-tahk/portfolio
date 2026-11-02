export const PALETTE = {
    color1: "#353a7a",
    color2: "#4ee8bf",
    color3: "#dbfff5"
}

export const DIAGONAL_FACTOR = 1/ Math.sqrt(2)
export const ZOOM_MAX_BOUND = 2
export const ZOOM_MIN_BOUND = 0.12

export const CAMERA_FOLLOW_RATE = 10 // higher = camera sticks closer to the player

// The whole map in fixed world units. Origin (0,0) is the player spawn; +x right, +y down.
// Place a new thing by giving it an {x, y} here and reading it as k.pos(x, y); never use k.width()/k.height().
export const LAYOUT = {
    map: { minX: -1700, maxX: 1700, minY: -1700, maxY: 1400 },
    spawn: { x: 0, y: 0 },
    sections: {
        projects: { x: -780, y: -450 },
        experience: { x: 780, y: -350 },
        skills: { x: 650, y: 650 },
    },
    sectionSize: 650,
    sectionHeight: 220,
    techLogos: { offsetX: -150, offsetY: 300, spacing: 150 },
}

// Camera zoom so the screen shows about VIEW world units: fit a VIEW_W x VIEW_H window into the screen
// The tighter axis wins. Keep the three neon platforms visible on desktop; phones follow the player.
const VIEW_W = 2600
const VIEW_H = 2000
export function zoomForScreen(width, height, headerHeight) {
    const compact = height <= 450
    const header = headerHeight ?? (compact ? 56 : width <= 700 ? 94 : 78)
    const topExtent = 300 - Math.min(...Object.values(LAYOUT.sections).map((p) => p.y))
    const zoom = Math.min(width / VIEW_W, height / VIEW_H, (height / 2 - header - 16) / topExtent)
    return Math.min(ZOOM_MAX_BOUND, Math.max(ZOOM_MIN_BOUND, zoom))
}

// A touch shorter than this is a tap (kick); held longer it walks toward the finger.
export const TAP_MAX_MS = 250

// Tech icons: on-screen size, kick strength (world units/s), how fast they slow (higher = stops sooner), and reach in player widths
export const ICON_KICK = { size: 100, speed: 2400, damping: 3, reachInPlayerWidths: 1.5, playerWidth: 40 }
