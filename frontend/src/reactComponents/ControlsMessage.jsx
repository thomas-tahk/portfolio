import { useState, useEffect } from "react";

export default function ControlsMessage() {
    const [isVisible, setIsVisible] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const handleActivity = () => {
            setLastActivity(Date.now());
            setIsVisible(false);
        };

        // Listen for any user activity
        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Check for idle state every second
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;
            
            if (timeSinceActivity >= 5000 && !isVisible) { // 5 seconds idle
                setIsVisible(true);
            }
        }, 1000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [isVisible, lastActivity]);

    return (
        <p 
            className={`controls-message ${isVisible ? 'controls-visible' : 'controls-hidden'}`}
        >
            Move: mouse, touch-hold, WASD or arrows. Kick tech icons: Space or tap. Put them back: Reset icons.
        </p>
    );
}