import { useEffect } from "react";
import { closeAllModals } from "./store";
import GameHeader from "./reactComponents/GameHeader";
import ControlsMessage from "./reactComponents/ControlsMessage";
import ProjectModal from "./reactComponents/ProjectModal";
import SkillsModal from "./reactComponents/SkillsModal";
import ExperienceModal from "./reactComponents/ExperienceModal";

export default function ReactUI() {
    useEffect(() => {
        const onKeyDown = (event) => event.key === "Escape" && closeAllModals()
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [])

    return (
        <>
            <GameHeader />
            <ControlsMessage />
            <ProjectModal />
            <SkillsModal />
            <ExperienceModal />
        </>
    )
}