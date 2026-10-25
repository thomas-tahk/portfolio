import { useEffect } from "react";

export default function PlainPageLink() {
    // Kaplay swallows Tab on the canvas; stop it before it gets there so keyboard users can reach this link
    useEffect(() => {
        const onKeyDown = (event) => event.key === "Tab" && event.stopImmediatePropagation()
        document.addEventListener("keydown", onKeyDown, true)
        return () => document.removeEventListener("keydown", onKeyDown, true)
    }, [])

    return (
        <a className="plain-page-link" href={import.meta.env.BASE_URL}>
            ← Plain version
        </a>
    );
}
