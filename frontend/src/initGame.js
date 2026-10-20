import makeSection from "./components/Section";
import makeKaplayCtx from "./kaplayCtx";
import { PALETTE } from "./constants";
import makePlayer from "./entities/Player";
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
    
    // player character scaling - adjusted for better overview
    if (k.width() < 1000) {
        store.set(cameraZoomValueAtom, 0.3)
        k.camScale(k.vec2(0.3))

    } else {
        store.set(cameraZoomValueAtom, 0.5)
        k.camScale(k.vec2(0.5))
    } 

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
    // Background text for intro (shadow/outline effect) - visible at top
    const socialSectionBg = k.add([
        k.text("Hi, I'm Thomas Tahk, a developer for the web and video games", {
            font: "ibm-bold",
            size: k.height() * 0.06, // Smaller font
        }),
        k.color(k.Color.fromHex("#000000")),
        k.anchor("center"),
        k.pos(k.center().x + 4, k.center().y - k.height() * 0.85), // Brought down to be fully visible
    ])

    // Foreground text for intro - visible at top
    const socialSection = k.add([
        k.text("Hi, I'm Thomas Tahk, a developer for the web and video games", {
            font: "ibm-bold",
            size: k.height() * 0.06, // Smaller font
        }),
        k.color(k.Color.fromHex("#f39c12")),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - k.height() * 0.85), // Brought down to be fully visible
    ])

    // Load Gmail logo sprite
    k.loadSprite("gmail-logo", `${BASE}logos/gmail-logo.svg`);

    // GitHub Logo - spaced down from intro text
    const githubLogo = k.add([
        k.sprite("github-logo"),
        k.scale(k.height() * 0.0002), // Responsive scale based on screen height
        k.anchor("center"),
        k.pos(k.center().x - k.width() * 0.15, k.center().y - k.height() * 0.73),
    ])

    // LinkedIn Logo - spaced down from intro text
    const linkedinLogo = k.add([
        k.sprite("linkedin-logo"),
        k.scale(k.height() * 0.0003), // Slightly larger for visual balance
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - k.height() * 0.73),
    ])

    // Gmail Logo - spaced down from intro text
    const gmailLogo = k.add([
        k.sprite("gmail-logo"),
        k.scale(k.height() * 0.0003), // Slightly larger for visual balance
        k.anchor("center"),
        k.pos(k.center().x + k.width() * 0.15, k.center().y - k.height() * 0.73),
    ])

    // Text labels - spaced down from logos
    // GitHub label background
    k.add([
        k.text("GitHub", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#000000")),
        k.anchor("center"),
        k.pos(k.center().x - k.width() * 0.15 + 2, k.center().y - k.height() * 0.65),
    ])
    // GitHub label foreground
    k.add([
        k.text("GitHub", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#f39c12")),
        k.anchor("center"),
        k.pos(k.center().x - k.width() * 0.15, k.center().y - k.height() * 0.65),
    ])

    // LinkedIn label background
    k.add([
        k.text("LinkedIn", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#000000")),
        k.anchor("center"),
        k.pos(k.center().x + 2, k.center().y - k.height() * 0.65),
    ])
    // LinkedIn label foreground
    k.add([
        k.text("LinkedIn", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#f39c12")),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - k.height() * 0.65),
    ])

    // Gmail label background
    k.add([
        k.text("Gmail", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#000000")),
        k.anchor("center"),
        k.pos(k.center().x + k.width() * 0.15 + 2, k.center().y - k.height() * 0.65),
    ])
    // Gmail label foreground
    k.add([
        k.text("Gmail", {
            font: "ibm-bold", 
            size: k.height() * 0.03, // Smaller font
        }),
        k.color(k.Color.fromHex("#f39c12")),
        k.anchor("center"),
        k.pos(k.center().x + k.width() * 0.15, k.center().y - k.height() * 0.65),
    ])

    // Social circles with collision detection
    const githubCircle = k.add([
        k.circle(k.height() * 0.06), // Smaller circles
        k.anchor("center"),
        k.area(),
        k.pos(k.center().x - k.width() * 0.15, k.center().y - k.height() * 0.55),
        k.color(k.Color.fromHex("#d35400")), // Darker orange
        k.outline(k.height() * 0.004, k.Color.fromHex("#000000")), // Responsive outline
        "github-social"
    ])

    const linkedinCircle = k.add([
        k.circle(k.height() * 0.06), // Smaller circles
        k.anchor("center"),
        k.area(),
        k.pos(k.center().x, k.center().y - k.height() * 0.55),
        k.color(k.Color.fromHex("#d35400")), // Darker orange
        k.outline(k.height() * 0.004, k.Color.fromHex("#000000")), // Responsive outline
        "linkedin-social"
    ])

    const gmailCircle = k.add([
        k.circle(k.height() * 0.06), // Smaller circles
        k.anchor("center"),
        k.area(),
        k.pos(k.center().x + k.width() * 0.15, k.center().y - k.height() * 0.55),
        k.color(k.Color.fromHex("#d35400")), // Darker orange
        k.outline(k.height() * 0.004, k.Color.fromHex("#000000")), // Responsive outline
        "gmail-social"
    ])

    // Add collision detection for social circles
    githubCircle.onCollide("player", () => {
        console.log("Entered GitHub circle!")
        store.set(selectedLinkAtom, "https://github.com/thomas-tahk")
        store.set(selectedLinkDescriptionAtom, "Check out my GitHub profile to see my code and projects!")
        store.set(isSocialModalVisibleAtom, true)
    })

    githubCircle.onCollideEnd("player", () => {
        console.log("Exited GitHub circle!")
        store.set(isSocialModalVisibleAtom, false)
    })

    linkedinCircle.onCollide("player", () => {
        console.log("Entered LinkedIn circle!")
        store.set(selectedLinkAtom, "https://linkedin.com/in/thomas-tahk-dev/")
        store.set(selectedLinkDescriptionAtom, "Connect with me on LinkedIn for professional networking!")
        store.set(isSocialModalVisibleAtom, true)
    })

    linkedinCircle.onCollideEnd("player", () => {
        console.log("Exited LinkedIn circle!")
        store.set(isSocialModalVisibleAtom, false)
    })

    gmailCircle.onCollide("player", () => {
        console.log("Entered Gmail circle!")
        store.set(isEmailModalVisibleAtom, true)
    })

    gmailCircle.onCollideEnd("player", () => {
        console.log("Exited Gmail circle!")
        store.set(isEmailModalVisibleAtom, false)
    })


    // Interactive squares/areas for portfolio sections - more spacing
    makeSection(
        k, 
        k.vec2(k.center().x, k.center().y - k.height() * 0.15), 
        "About", 
        (section) => {
            console.log("Entered About section!")
            store.set(isAboutModalVisibleAtom, true)
        },
        (section) => {
            console.log("Exited About section!")
            store.set(isAboutModalVisibleAtom, false)
        }
    )

    makeSection(
        k, 
        k.vec2(k.center().x - k.width() * 0.3, k.center().y + k.height() * 0.1), 
        "Skills",
        (section) => {
            console.log("Entered Skills section!")
            store.set(isSkillsModalVisibleAtom, true)
            // Reset logos to initial positions when re-entering (if any exist)
            if (spawnedLogos.length > 0) {
                spawnTechLogos()
            }
        },
        (section) => {
            console.log("Exited Skills section!")
            store.set(isSkillsModalVisibleAtom, false)
            // Spawn logos when exiting (first time or reset)
            spawnTechLogos()
        }
    )

    makeSection(
        k, 
        k.vec2(k.center().x + k.width() * 0.3, k.center().y + k.height() * 0.1), 
        "Experience",
        (section) => {
            console.log("Entered Experience section!")
            store.set(isExperienceModalVisibleAtom, true)
        },
        (section) => {
            console.log("Exited Experience section!")
            store.set(isExperienceModalVisibleAtom, false)
        }
    )

    makeSection(
        k, 
        k.vec2(k.center().x, k.center().y + k.height() * 0.35), 
        "Projects",
        (section) => {
            console.log("Entered Projects section!")
            store.set(isProjectModalVisibleAtom, true)
        },
        (section) => {
            console.log("Exited Projects section!")
            store.set(isProjectModalVisibleAtom, false)
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
        const skillsPos = k.vec2(k.center().x - k.width() * 0.3, k.center().y + k.height() * 0.1)
        
        // Create 3x3 grid to the left of Skills section with even more offset and spacing
        const startX = skillsPos.x - k.width() * 0.5   // Even more offset from Skills square
        const startY = skillsPos.y - k.height() * 0.2   // Much higher starting position
        const spacing = k.height() * 0.15  // Much more spacing between logos
        
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
        
        console.log(`Spawned ${spawnedLogos.length} tech logos!`)
    }
    
    function clearTechLogos() {
        spawnedLogos.forEach(logo => {
            if (logo.exists()) {
                logo.destroy()
            }
        })
        spawnedLogos = []
    }

    // create player object nudged up a bit more for final positioning
    makePlayer(k, k.vec2(k.center().x, k.center().y), 700)

}