export const PALETTE = {
    color1: "#353a7a",
    color2: "#4ee8bf",
    color3: "#dbfff5"
}

export const DIAGONAL_FACTOR = 1/ Math.sqrt(2)
export const ZOOM_MAX_BOUND = 2
export const ZOOM_MIN_BOUND = 0.2

export const CAMERA_FOLLOW_RATE = 10 // higher = camera sticks closer to the player

// The whole map in fixed world units. Origin (0,0) is the player spawn; +x right, +y down.
// Place a new thing by giving it an {x, y} here and reading it as k.pos(x, y); never use k.width()/k.height().
export const LAYOUT = {
    map: { minX: -1700, maxX: 1700, minY: -1700, maxY: 1400 },
    spawn: { x: 0, y: 0 },
    intro: { x: 0, y: -1500, fontSize: 90 },
    socials: {
        github: { x: -600, y: -1000 },
        linkedin: { x: 0, y: -1000 },
        gmail: { x: 600, y: -1000 },
    },
    socialRadius: 90,
    socialLogoDy: -200, // logo sits this far above its circle
    socialLabelDy: -100, // label sits this far above its circle
    socialLabelFontSize: 40,
    socialLogoScale: { github: 0.2, linkedin: 0.3, gmail: 0.3 },
    sections: {
        about: { x: 0, y: -500 },
        skills: { x: -900, y: 250 },
        experience: { x: 900, y: 250 },
        projects: { x: 0, y: 900 },
    },
    sectionSize: 200, // square side
    sectionFontSize: 70,
    outlineWidth: 3,
    // Skills tech-logo grid, relative to the Skills section centre
    techLogos: { offsetX: -500, offsetY: -200, spacing: 150 },
}

// Camera zoom so the screen shows about VIEW world units: fit a VIEW_W x VIEW_H window into the screen
// (the tighter axis wins), clamped to the +/- button bounds. Phone portrait ~0.25, 1280x800 ~0.67.
const VIEW_W = 1500
const VIEW_H = 1200
export function zoomForScreen(width, height) {
    const zoom = Math.min(width / VIEW_W, height / VIEW_H)
    return Math.min(ZOOM_MAX_BOUND, Math.max(ZOOM_MIN_BOUND, zoom))
}
