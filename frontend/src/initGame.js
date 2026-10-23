import makeSection from "./components/Section";
import makeKaplayCtx from "./kaplayCtx";
import { PALETTE, LAYOUT, zoomForScreen } from "./constants";
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
    function addShadowedText(str, x, y, size) {
        for (const [color, dx] of [[black, SHADOW], [orange, 0]]) {
            k.add([
                k.text(str, { font: "ibm-bold", size }),
                k.color(color),
                k.anchor("center"),
                k.pos(x + dx, y),
            ])
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
            // Reset logos to initial positions when re-entering (if any exist)
            if (spawnedLogos.length > 0) {
                spawnTechLogos()
            }
        },
        () => {
            // Spawn logos when exiting (first time or reset)
            spawnTechLogos()
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

    // Tech stack logos for Skills section interactivity
    let spawnedLogos = []
    
    function spawnTechLogos() {
        // Clear any existing logos first
        clearTechLogos()
        
        const logoData = [
            { name: "javascript-logo", scale: 0.5 },
            { name: "typescript-logo", scale: 0.5 },
            { name: "react-logo", scale: 0.4 },
            { name: "nextjs-logo", scale: 0.6 },
            { name: "html-logo", scale: 0.5 },
            { name: "css-logo", scale: 0.5 },
            { name: "tailwind-logo", scale: 0.6 },
            { name: "python-logo", scale: 0.4 },
            { name: "postgres-logo", scale: 0.4 }
        ]
        
        // Skills section position (reference point)
        const skillsPos = k.vec2(L.sections.skills.x, L.sections.skills.y)
        
        // Create 3x3 grid to the left of Skills section with even more offset and spacing
        const startX = skillsPos.x + L.techLogos.offsetX
        const startY = skillsPos.y + L.techLogos.offsetY
        const spacing = L.techLogos.spacing
        
        logoData.forEach((logoInfo, index) => {
            const row = Math.floor(index / 3)
            const col = index % 3
            
            const logo = k.add([
                k.sprite(logoInfo.name),
                k.scale(logoInfo.scale),
                k.anchor("center"),
                k.area(),
                k.body({ 
                    jumpForce: 0,     // Disable jumping
                    mass: 0.1,        // Very light mass
                    friction: 0.3,    // Low friction for easy sliding
                    bounce: 0.8       // High bounce for dynamic feel
                }), 
                k.pos(startX + col * spacing, startY + row * spacing),
                "tech-logo"
            ])
            
            spawnedLogos.push(logo)
        })
        
    }
    
    function clearTechLogos() {
        spawnedLogos.forEach(logo => {
            if (logo.exists()) {
                logo.destroy()
            }
        })
        spawnedLogos = []
    }

    // every interactive zone as {name, x, y, w, h} in world units (test hook)
    function getZones() {
        const sections = Object.entries(L.sections).map(([name, p]) => ({ name, x: p.x, y: p.y, w: L.sectionSize, h: L.sectionSize }))
        const socials = Object.entries(L.socials).map(([name, p]) => ({ name, x: p.x, y: p.y, w: L.socialRadius * 2, h: L.socialRadius * 2 }))
        return [...sections, ...socials]
    }

    // create player object nudged up a bit more for final positioning
    const player = makePlayer(k, k.vec2(L.spawn.x, L.spawn.y), 700)
    // test hook: lets Playwright read the player (prod build, so gated on the URL, not build mode)
    if (new URLSearchParams(window.location.search).has("test")) {
        window.__player = player
        window.__layout = { map: L.map, zoneSize: L.sectionSize, zones: getZones() }
    }

}