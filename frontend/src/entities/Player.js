import { DIAGONAL_FACTOR } from "../constants";
import { isAnyModalOpen } from "../store";

// make instance of a player with the following properties
export default function makePlayer(k, posVec2, speed) {
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

    // TODO: player controls, etc...
    let isMouseDown = false
    const game = document.getElementById("game");
    game.addEventListener("focusout", () => {
        isMouseDown = false
    })
    game.addEventListener("mousedown", () => {
        isMouseDown = true
    })
    game.addEventListener("mouseup", () => {
        isMouseDown = false
    })  
    game.addEventListener("touchstart", (e) => {
        isMouseDown = true
    })
    game.addEventListener("touchend", (e) => {
        isMouseDown = false
    })

    player.onUpdate(() => {
        
        // Camera follows player centered
        const targetCamPos = k.vec2(player.pos.x, player.pos.y)
        if (!k.camPos().eq(targetCamPos)) {
            k.tween(
                k.camPos(), 
                targetCamPos, 
                0.2, 
                (newPost) => k.camPos(newPost),
                k.easings.linear
            )
        }

        // Modal open: ignore movement so the touch that dismisses it doesn't walk into another zone
        if (isAnyModalOpen()) {
            isMouseDown = false
            player.direction = k.vec2(0, 0)
            if (!player.getCurAnim().name.includes("idle")) {
                player.play(`${player.directionName}-idle`)
            }
            return
        }

        player.direction = k.vec2(0, 0)
        
        // Keyboard controls (WASD + Arrow Keys)
        if (k.isKeyDown("w") || k.isKeyDown("up")) {
            player.direction.y -= 1
        }
        if (k.isKeyDown("s") || k.isKeyDown("down")) {
            player.direction.y += 1
        }
        if (k.isKeyDown("a") || k.isKeyDown("left")) {
            player.direction.x -= 1
        }
        if (k.isKeyDown("d") || k.isKeyDown("right")) {
            player.direction.x += 1
        }
        
        // Mouse controls (fallback if no keyboard input)
        if (player.direction.eq(k.vec2(0, 0))) {
            const worldMousePos = k.toWorld(k.mousePos())
            if (isMouseDown) {
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

    return player
}