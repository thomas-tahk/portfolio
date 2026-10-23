import makeSection from "./components/Section";
import makeKaplayCtx from "./kaplayCtx";
import { PALETTE, LAYOUT, ICON_KICK, zoomForScreen } from "./constants";
import makePlayer from "./entities/Player";
import content from "./content.json";
import { cameraZoomValueAtom, store, isAboutModalVisibleAtom, isSkillsModalVisibleAtom, isExperienceModalVisibleAtom, isProjectModalVisibleAtom, isSocialModalVisibleAtom, isEmailModalVisibleAtom, selectedLinkAtom, selectedLinkDescriptionAtom } from "./store";

const BASE = import.meta.env.BASE_URL

export default async function initGame() {
    const k = makeKaplayCtx()
    // player sprite and designating which frames are for which animations
    k.loadSprite("player", `${BASE}sprites/player.png`, {
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
    k.loadSprite("github-logo", `${BASE}logos/github-logo.png`);
    k.loadSprite("linkedin-logo", `${BASE}logos/linkedin-logo.png`);
    // k.loadSprite("youtube-logo", "/logos/youtube-logo.png");
    // k.loadSprite("x-logo", "/logos/x-logo.png");
    // k.loadSprite("substack-logo", "/logos/substack-logo.png");
    k.loadSprite("javascript-logo", `${BASE}logos/js-logo.png`);
    k.loadSprite("typescript-logo", `${BASE}logos/ts-logo.png`);
    k.loadSprite("react-logo", `${BASE}logos/react-logo.png`);
    k.loadSprite("nextjs-logo", `${BASE}logos/nextjs-logo.png`);
    k.loadSprite("postgres-logo", `${BASE}logos/postgres-logo.png`);
    k.loadSprite("html-logo", `${BASE}logos/html-logo.png`);
    k.loadSprite("css-logo", `${BASE}logos/css-logo.png`);
    k.loadSprite("tailwind-logo", `${BASE}logos/tailwind-logo.png`);
    k.loadSprite("python-logo", `${BASE}logos/python-logo.png`);
    // k.loadSprite("email-logo", "/logos/email-logo.png");
    // a shader is a program that runs on gpu that changes color of pixel on screen
    // kinda like a printing press for computer screens
    // we're using a fragment shader program written in glsl specific to kaplay
    k.loadShaderURL("tiledPattern", null, `${BASE}shaders/tiledPattern.frag`);
    
    // zoom is derived from the screen size (see zoomForScreen) and recomputed on resize/rotate
    const fitZoom = () => store.set(cameraZoomValueAtom, zoomForScreen(k.width(), k.height()))
    fitZoom()
    k.camScale(k.vec2(store.get(cameraZoomValueAtom)))
    k.onResize(fitZoom)

    k.onUpdate(() => {
        const camZoomValue = store.get(cameraZoomValueAtom)
        if (camZoomValue !== k.camScale()) {
            k.camScale(k.vec2(camZoomValue))
        }
    })    
    
    // gameobject that displays the shader
    const tiledBackground = k.add([
        k.uvquad(k.width(), k.height()),
        k.shader("tiledPattern", () => ({
            u_time: k.time() / 20,
            u_color1: k.Color.fromHex(PALETTE.color1),
            u_color2: k.Color.fromHex(PALETTE.color2),
            u_speed: k.vec2(1, -1),  // feel free to change this to liking
            u_aspect: k.width() / k.height(),
            u_size: 5,
    })),
    k.pos(0),
    k.fixed()
    ])

    // makes tiled pattern responsive to window resizing
    k.onResize(() => {
        tiledBackground.width = k.width()
        tiledBackground.height = k.height()
        tiledBackground.uniform.u_aspect = k.width() / k.height()
    })
    const L = LAYOUT
    const SHADOW = 3 // world units; offset of the dark text shadow
    const orange = k.Color.fromHex("#f39c12")
    const black = k.Color.fromHex("#000000")

    // text with a dark shadow behind it, centred on (x, y)
    // lines wrap at L.textWrapWidth so the long intro fits a phone screen at load zoom
    const textWidths = [] // rendered widths, exposed to tests
    function addShadowedText(str, x, y, size) {
        for (const [color, dx] of [[black, SHADOW], [orange, 0]]) {
            const textObj = k.add([
                k.text(str, { font: "ibm-bold", size, width: L.textWrapWidth, align: "center" }),
                k.color(color),
                k.anchor("center"),
                k.pos(x + dx, y),
            ])
            if (dx === 0) textWidths.push(textObj.width)
        }
    }

    addShadowedText(content.gameIntro, L.intro.x, L.intro.y, L.intro.fontSize)

    // Load Gmail logo sprite
    k.loadSprite("gmail-logo", `${BASE}logos/gmail-logo.svg`);

    // Social logo + label + collision circle, one column per link
    function addSocial(key, label, logoSprite, logoScale, tag) {
        const s = L.socials[key]
        k.add([
            k.sprite(logoSprite),
            k.scale(logoScale),
            k.anchor("center"),
            k.pos(s.x, s.y + L.socialLogoDy),
        ])
        addShadowedText(label, s.x, s.y + L.socialLabelDy, L.socialLabelFontSize)
        return k.add([
            k.circle(L.socialRadius),
            k.anchor("center"),
            k.area(),
            k.pos(s.x, s.y),
            k.color(k.Color.fromHex("#d35400")), // Darker orange
            k.outline(L.outlineWidth, black),
            tag
        ])
    }

    const githubCircle = addSocial("github", "GitHub", "github-logo", L.socialLogoScale.github, "github-social")
    const linkedinCircle = addSocial("linkedin", "LinkedIn", "linkedin-logo", L.socialLogoScale.linkedin, "linkedin-social")
    const gmailCircle = addSocial("gmail", "Gmail", "gmail-logo", L.socialLogoScale.gmail, "gmail-social")

    // Add collision detection for social circles
    githubCircle.onCollide("player", () => {
        store.set(selectedLinkAtom, content.contact.github)
        store.set(selectedLinkDescriptionAtom, "Check out my GitHub profile to see my code and projects!")
        store.set(isSocialModalVisibleAtom, true)
    })

    linkedinCircle.onCollide("player", () => {
        store.set(selectedLinkAtom, content.contact.linkedin)
        store.set(selectedLinkDescriptionAtom, "Connect with me on LinkedIn for professional networking!")
        store.set(isSocialModalVisibleAtom, true)
    })

    gmailCircle.onCollide("player", () => {
        store.set(isEmailModalVisibleAtom, true)
    })


    // Interactive squares/areas for portfolio sections - more spacing
    makeSection(
        k, 
        k.vec2(L.sections.about.x, L.sections.about.y), 
        "About",
        () => {
            store.set(isAboutModalVisibleAtom, true)
        }
    )

    makeSection(
        k, 
        k.vec2(L.sections.skills.x, L.sections.skills.y), 
        "Skills",
        () => {
            store.set(isSkillsModalVisibleAtom, true)
        },
        () => {
        }
    )

    makeSection(
        k,
        k.vec2(L.sections.experience.x, L.sections.experience.y), 
        "Experience",
        () => {
            store.set(isExperienceModalVisibleAtom, true)
        }
    )

    makeSection(
        k, 
        k.vec2(L.sections.projects.x, L.sections.projects.y), 
        "Projects",
        () => {
            store.set(isProjectModalVisibleAtom, true)
        }
    )

    // Tech icons: a cluster near Skills from load. Kick with Space / tap; they slow to a stop; closing the Skills popup puts them back.
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
            k.sprite(name),
            k.scale(1),
            k.anchor("center"),
            k.area(),
            k.body(),
            k.pos(start),
            "tech-logo",
            { start, drift: k.vec2(0, 0), logoName: name }
        ])
        logo.scale = k.vec2(ICON_KICK.size / Math.max(logo.width, logo.height)) // same on-screen size for every logo
        logo.onUpdate(() => {
            logo.move(logo.drift)
            logo.drift = logo.drift.scale(Math.exp(-ICON_KICK.damping * k.dt()))
            if (logo.drift.len() < 5) logo.drift = k.vec2(0, 0)
            logo.pos.x = Math.min(L.map.maxX, Math.max(L.map.minX, logo.pos.x))
            logo.pos.y = Math.min(L.map.maxY, Math.max(L.map.minY, logo.pos.y))
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

    // closing the Skills popup snaps every icon back to its home spot
    store.sub(isSkillsModalVisibleAtom, () => {
        if (store.get(isSkillsModalVisibleAtom)) return
        techLogos.forEach((logo) => {
            logo.pos = logo.start.clone()
            logo.drift = k.vec2(0, 0)
        })
    })

    // every interactive zone as {name, x, y, w, h} in world units (test hook)
    function getZones() {
        const sections = Object.entries(L.sections).map(([name, p]) => ({ name, x: p.x, y: p.y, w: L.sectionSize, h: L.sectionSize }))
        const socials = Object.entries(L.socials).map(([name, p]) => ({ name, x: p.x, y: p.y, w: L.socialRadius * 2, h: L.socialRadius * 2 }))
        return [...sections, ...socials]
    }

    // create player object nudged up a bit more for final positioning
    const player = makePlayer(k, k.vec2(L.spawn.x, L.spawn.y), 700, kickNearestLogo)
    // test hook: lets Playwright read the player (prod build, so gated on the URL, not build mode)
    if (new URLSearchParams(window.location.search).has("test")) {
        window.__player = player
        window.__layout = { map: L.map, zoneSize: L.sectionSize, zones: getZones(), maxTextWidth: Math.max(...textWidths) }
        window.__icons = () => techLogos.map((l) => ({ name: l.logoName, x: l.pos.x, y: l.pos.y, startX: l.start.x, startY: l.start.y }))
    }

}