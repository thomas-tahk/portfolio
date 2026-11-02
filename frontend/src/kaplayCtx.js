import kaplay from "kaplay"

export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        background: "#0b1125",
        pixelDensity: 2,
        touchToMouse: true,
        debug: false,
        debugKey: "f1",
        canvas: document.getElementById("game")       
    })
}