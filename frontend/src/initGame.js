import makeSection from "./components/Section";
import makeKaplayCtx from "./kaplayCtx";
import { LAYOUT, ICON_KICK, zoomForScreen } from "./constants";
import makePlayer from "./entities/Player";
import { wrapToMap } from "./utils";
import loadPlazaArt from "./components/plazaArt";
import makePlaza from "./components/Plaza";
import { cameraZoomValueAtom, resetPlazaRequestAtom, closeAllModals, store, isSkillsModalVisibleAtom, isExperienceModalVisibleAtom, isProjectModalVisibleAtom } from "./store";

const BASE = import.meta.env.BASE_URL

export default async function initGame() {
    const k = makeKaplayCtx()
    loadPlazaArt(k)
    // player sprite and designating which frames are for which animations
    k.loadSprite("player", `${BASE}sprites/arcade-explorer.svg`, {
        sliceX: 4, // number of frames per row
        sliceY: 8, // number of frames per column
        anims: {
            // numbering indicates the sprite/frame ordering 0 starts at top left then goes right before moving to next row
            "walk-down-idle": 0,
            "walk-down": { from: 0, to: 3, loop: true },
            "walk-left-down": { from: 4, to: 7, loop: true },
            "walk-left-down-idle": 4,
            "walk-left": { from: 8, to: 11, loop: true },
            "walk-left-idle": 8,
            "walk-left-up": { from: 12, to: 15, loop: true },
            "walk-left-up-idle": 12,
            "walk-up": { from: 16, to: 19, loop: true },
            "walk-up-idle": 16,
            "walk-right-up": { from: 20, to: 23, loop: true },
            "walk-right-up-idle": 20,
            "walk-right": { from: 24, to: 27, loop: true },
            "walk-right-idle": 24,
            "walk-right-down": { from: 28, to: 31, loop: true },
            "walk-right-down-idle": 28
        }
    })
    // loading various fonts and sprites to be used in the project
    k.loadFont("ibm-regular", `${BASE}fonts/IBMPlexSans-Regular.ttf`);
    k.loadFont("ibm-bold", `${BASE}fonts/IBMPlexSans-Bold.ttf`);
    k.loadSprite("javascript-logo", `${BASE}logos/js-logo.png`);
    k.loadSprite("typescript-logo", `${BASE}logos/ts-logo.png`);
    k.loadSprite("react-logo", `${BASE}logos/react-logo.png`);
    k.loadSprite("nextjs-logo", `${BASE}logos/nextjs-logo.png`);
    k.loadSprite("postgres-logo", `${BASE}logos/postgres-logo.png`);
    k.loadSprite("html-logo", `${BASE}logos/html-logo.png`);
    k.loadSprite("css-logo", `${BASE}logos/css-logo.png`);
    k.loadSprite("tailwind-logo", `${BASE}logos/tailwind-logo.png`);
    k.loadSprite("python-logo", `${BASE}logos/python-logo.png`);
    // zoom is derived from the screen size (see zoomForScreen) and recomputed on resize/rotate
    const fitZoom = () => store.set(cameraZoomValueAtom, zoomForScreen(k.width(), k.height(), document.querySelector(".game-header")?.getBoundingClientRect().height))
    fitZoom()
    k.camScale(k.vec2(store.get(cameraZoomValueAtom)))
    k.onResize(fitZoom)
    k.onLoad(fitZoom)

    k.onUpdate(() => {
        const camZoomValue = store.get(cameraZoomValueAtom)
        if (camZoomValue !== k.camScale()) {
            k.camScale(k.vec2(camZoomValue))
        }
    })    
    
    const L = LAYOUT
    makePlaza(k)
    const destinations = {
        projects: isProjectModalVisibleAtom,
        experience: isExperienceModalVisibleAtom,
        skills: isSkillsModalVisibleAtom,
    }
    Object.entries(destinations).forEach(([name, atom]) => {
        makeSection(k, { name, onEnter: () => store.set(atom, true) })
    })

    // Tech icons: a cluster below Skills from load. Kick with Space / tap; they slow to a stop; closing the Skills popup puts them back.
    const TECH_LOGOS = [
        "javascript-logo",
        "typescript-logo",
        "react-logo",
        "nextjs-logo",
        "html-logo",
        "css-logo",
        "tailwind-logo",
        "python-logo",
        "postgres-logo"
    ]

    function addTechLogo(name, index) {
        const T = L.techLogos
        const start = k.vec2(
            L.sections.skills.x + T.offsetX + (index % 3) * T.spacing,
            L.sections.skills.y + T.offsetY + Math.floor(index / 3) * T.spacing
        )
        const logo = k.add([
            k.sprite(`${["projects", "experience", "skills"][index % 3]}-ball`),
            k.scale(1),
            k.anchor("center"),
            k.area(),
            k.body(),
            k.pos(start),
            k.z(2),
            "tech-logo",
            { start, drift: k.vec2(0, 0), logoName: name }
        ])
        logo.scale = k.vec2(ICON_KICK.size / Math.max(logo.width, logo.height)) // same on-screen size for every logo
        const emblem = logo.add([k.sprite(name), k.anchor("center"), k.pos(0)])
        emblem.scale = k.vec2(58 / Math.max(emblem.width, emblem.height))
        logo.onUpdate(() => {
            logo.move(logo.drift)
            logo.drift = logo.drift.scale(Math.exp(-ICON_KICK.damping * k.dt()))
            if (logo.drift.len() < 5) logo.drift = k.vec2(0, 0)
            wrapToMap(logo.pos, L.map) // past an edge, re-enter from the opposite side so icons can't be lost
        })
        return logo
    }

    let techLogos = []
    k.onLoad(() => { techLogos = TECH_LOGOS.map(addTechLogo) }) // sprite sizes are only known once loaded

    // kick the nearest icon if there is at most 1.5 player widths of empty space between it and the player
    function kickNearestLogo() {
        const reachGap = ICON_KICK.reachInPlayerWidths * ICON_KICK.playerWidth
        const playerHalf = ICON_KICK.playerWidth / 2
        let nearest = null
        let nearestGap = Infinity
        for (const logo of techLogos) {
            const gap = logo.pos.dist(player.pos) - playerHalf - (Math.max(logo.width, logo.height) * logo.scale.x) / 2
            if (gap < nearestGap) { nearest = logo; nearestGap = gap }
        }
        if (!nearest || nearestGap > reachGap) return
        nearest.drift = nearest.pos.sub(player.pos).unit().scale(ICON_KICK.speed)
    }

    function resetTechLogos() {
        techLogos.forEach((logo) => {
            logo.pos = logo.start.clone()
            logo.drift = k.vec2(0)
            logo.vel = k.vec2(0)
        })
    }

    // Closing Skills restores its tech balls; Reset plaza also restores the player.
    store.sub(isSkillsModalVisibleAtom, () => {
        if (!store.get(isSkillsModalVisibleAtom)) resetTechLogos()
    })

    // every interactive zone as {name, x, y, w, h} in world units (test hook)
    function getZones() {
        const sections = Object.entries(L.sections).map(([name, p]) => ({ name, x: p.x, y: p.y, w: L.sectionSize, h: L.sectionHeight }))
        return sections
    }

    // create player object nudged up a bit more for final positioning
    const player = makePlayer(k, k.vec2(L.spawn.x, L.spawn.y), 700, kickNearestLogo, L.map)
    store.sub(resetPlazaRequestAtom, () => {
        closeAllModals()
        resetTechLogos()
        player.resetToSpawn()
    })
    // test hook: lets Playwright read the player (prod build, so gated on the URL, not build mode)
    if (new URLSearchParams(window.location.search).has("test")) {
        window.__player = player
        window.__layout = { map: L.map, zoneSize: L.sectionSize, zones: getZones(), maxTextWidth: L.sectionSize }
        window.__cam = () => ({ x: k.camPos().x, y: k.camPos().y, zoom: k.camScale().x })
        window.__iconObjects = () => techLogos
        window.__icons = () => techLogos.map((l) => ({ name: l.logoName, x: l.pos.x, y: l.pos.y, startX: l.start.x, startY: l.start.y }))
    }

}