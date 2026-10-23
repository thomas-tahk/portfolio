import { useState, useEffect } from "react";

export default function ControlsMessage() {
    const [isDismissed, setIsDismissed] = useState(false);

    // Hide for good once the player starts moving (key, touch or mouse press)
    useEffect(() => {
        const dismiss = () => setIsDismissed(true);
        const events = ['mousedown', 'keydown', 'touchstart'];
        events.forEach(event => document.addEventListener(event, dismiss, { once: true }));
        return () => events.forEach(event => document.removeEventListener(event, dismiss));
    }, []);

    if (isDismissed) return null;

    return (
        <div className="controls-message">
            <p>Move: mouse, touch-hold, WASD or arrows. Kick tech icons: Space or tap. Put them back: Reset icons.</p>
            <button className="controls-close" aria-label="Dismiss controls hint" onClick={() => setIsDismissed(true)}>
                ✕
            </button>
        </div>
    );
}
