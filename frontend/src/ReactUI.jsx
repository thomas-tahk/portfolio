import { useEffect } from "react";
import { closeAllModals } from "./store";
import PlainPageLink from "./reactComponents/PlainPageLink";
import ControlsMessage from "./reactComponents/ControlsMessage";
import AboutModal from "./reactComponents/AboutModal";
import EmailModal from "./reactComponents/EmailModal";
import ProjectModal from "./reactComponents/ProjectModal";
import SocialModal from "./reactComponents/SocialModal";
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
            <PlainPageLink />
            <ControlsMessage />
            <AboutModal />
            <EmailModal />
            <ProjectModal />
            <SocialModal />
            <SkillsModal />
            <ExperienceModal />
        </>
    )
}