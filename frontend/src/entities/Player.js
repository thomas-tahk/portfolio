import { DIAGONAL_FACTOR, CAMERA_FOLLOW_RATE, TAP_MAX_MS } from "../constants";
import { isAnyModalOpen } from "../store";
import { wrapToMap } from "../utils";

// make instance of a player with the following properties
export default function makePlayer(k, posVec2, speed, onKick, map) {
    const player = k.add([
        k.sprite("player", {anim: "walk-down-idle"}),
        k.scale(8),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), 5, 10)}),
        k.body(),
        k.pos(posVec2),
        "player",
        {
            direction: k.vec2(0, 0),
            directionName: "walk-down",
        }
    ])

    k.camPos(player.pos) // start centred on the player (no initial slide)

    // TODO: player controls, etc...
    let isMouseDown = false
    let touchStartedAt = null // ms timestamp while a finger is down; a touch only walks once held past TAP_MAX_MS
    let lastTouchAt = 0 // browsers fire synthetic mouse events after a touch; ignore them
    const game = document.getElementById("game");
    const SYNTHETIC_MOUSE_MS = 600

    // Held keys are tracked here (not via k.isKeyDown) so they can be cleared when focus is lost:
    // the keyup/mouseup/touchend that would release them never arrives while the tab or window is unfocused.
    const heldKeys = new Set()
    document.addEventListener("keydown", (event) => heldKeys.add(event.code))
    document.addEventListener("keyup", (event) => heldKeys.delete(event.code))
    const isHeld = (...codes) => codes.some((code) => heldKeys.has(code))
    const releaseAllInput = () => {
        heldKeys.clear()
        isMouseDown = false
        touchStartedAt = null
    }
    game.addEventListener("focusout", releaseAllInput)
    window.addEventListener("blur", releaseAllInput)
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && releaseAllInput())
    game.addEventListener("mousedown", () => {
        if (performance.now() - lastTouchAt < SYNTHETIC_MOUSE_MS) return
        isMouseDown = true
    })
    game.addEventListener("mouseup", () => {
        isMouseDown = false
    })  
    game.addEventListener("touchstart", () => {
        touchStartedAt = lastTouchAt = performance.now()
    })
    game.addEventListener("touchend", () => {
        lastTouchAt = performance.now()
        const wasTap = touchStartedAt !== null && lastTouchAt - touchStartedAt < TAP_MAX_MS
        touchStartedAt = null
        if (wasTap && !isAnyModalOpen()) onKick()
    })
    game.addEventListener("touchcancel", () => {
        touchStartedAt = null
    })

    const isTouchWalking = () => touchStartedAt !== null && performance.now() - touchStartedAt >= TAP_MAX_MS

    player.onUpdate(() => {
        
        // Camera eases toward the player: one lerp per frame, framerate independent
        k.camPos(k.camPos().lerp(player.pos, 1 - Math.exp(-CAMERA_FOLLOW_RATE * k.dt())))

        // Modal open: ignore movement so the touch that dismisses it doesn't walk into another zone
        if (isAnyModalOpen()) {
            isMouseDown = false
            touchStartedAt = null
            player.direction = k.vec2(0, 0)
            if (!player.getCurAnim().name.includes("idle")) {
                player.play(`${player.directionName}-idle`)
            }
            return
        }

        player.direction = k.vec2(0, 0)
        
        // Keyboard controls (WASD + Arrow Keys)
        if (isHeld("KeyW", "ArrowUp")) {
            player.direction.y -= 1
        }
        if (isHeld("KeyS", "ArrowDown")) {
            player.direction.y += 1
        }
        if (isHeld("KeyA", "ArrowLeft")) {
            player.direction.x -= 1
        }
        if (isHeld("KeyD", "ArrowRight")) {
            player.direction.x += 1
        }
        
        // Mouse controls (fallback if no keyboard input)
        if (player.direction.eq(k.vec2(0, 0))) {
            const worldMousePos = k.toWorld(k.mousePos())
            if (isMouseDown || isTouchWalking()) {
                player.direction = worldMousePos.sub(player.pos).unit()
            }
        } else {
            // Normalize keyboard direction for consistent speed
            player.direction = player.direction.unit()
        }
        // implement animations based on direction of player
        // when to play idle
        if (player.direction.eq(k.vec2(0, 0)) && 
        !player.getCurAnim().name.includes("idle")) {
            player.play(`${player.directionName}-idle`)
            return
        }

        // Pure directions first (more priority)
        if (Math.abs(player.direction.y) > Math.abs(player.direction.x)) {
            // Vertical movement is stronger
            if (player.direction.y < -0.7) {
                player.directionName = "walk-up";
            } else if (player.direction.y > 0.7) {
                player.directionName = "walk-down";
            }
        } else if (Math.abs(player.direction.x) > Math.abs(player.direction.y)) {
            // Horizontal movement is stronger
            if (player.direction.x > 0.7) {
                player.directionName = "walk-right";
            } else if (player.direction.x < -0.7) {
                player.directionName = "walk-left";
            }
        } else {
            // Diagonal movements (when x and y are roughly equal)
            if (player.direction.x > 0 && player.direction.y < 0) {
                player.directionName = "walk-right-up";
            } else if (player.direction.x > 0 && player.direction.y > 0) {
                player.directionName = "walk-right-down";
            } else if (player.direction.x < 0 && player.direction.y < 0) {
                player.directionName = "walk-left-up";
            } else if (player.direction.x < 0 && player.direction.y > 0) {
                player.directionName = "walk-left-down";
            }
        }
      
          // play any animation that is not idle, prevent replaying if you're already playing the correct animation. 
          if (player.getCurAnim().name !== player.directionName) {
            player.play(player.directionName);
          }
      
          // move player in the direction they are facing
          if (player.direction.x && player.direction.y) {
            player.move(player.direction.scale(DIAGONAL_FACTOR * speed));
            return;
          }

        player.move(player.direction.scale(speed))
    })

    // Past a map edge: teleport to the opposite edge and shift the camera by the same jump so it doesn't sweep across the map
    player.onUpdate(() => {
        const { dx, dy } = wrapToMap(player.pos, map)
        if (dx || dy) k.camPos(k.camPos().add(k.vec2(dx, dy)))
    })

    k.onKeyPress("space", () => {
        if (!isAnyModalOpen()) onKick()
    })

    return player
}