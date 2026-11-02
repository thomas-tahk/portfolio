import { atom, createStore } from 'jotai';
import content from './content.json';

export const isProjectModalVisibleAtom = atom(false);
export const chosenProjectDataAtom = atom({
    title: "Projects",
    projects: content.projects
        .filter((project) => !project.hidden)
        .map((project, id) => ({
            id,
            name: project.name,
            description: project.description,
            links: project.links.map((link, linkId) => ({ id: linkId, name: link.label, link: link.url }))
        }))
})

export const isSkillsModalVisibleAtom = atom(false);
export const skillsDataAtom = atom({
    title: "Skills & Technologies",
    categories: content.skills
})

export const isExperienceModalVisibleAtom = atom(false);
export const experienceDataAtom = atom({
    title: "Experience",
    experiences: content.experience
})

export const cameraZoomValueAtom = atom({value : 1})

export const store = createStore()

const modalAtoms = [
    isProjectModalVisibleAtom,
    isSkillsModalVisibleAtom,
    isExperienceModalVisibleAtom,
]

export const isAnyModalOpen = () => modalAtoms.some((modalAtom) => store.get(modalAtom))

export const closeAllModals = () => modalAtoms.forEach((modalAtom) => store.set(modalAtom, false))

// Tap/click on the dimmed backdrop (not the modal box) dismisses.
export const dismissOnBackdrop = (event) => {
    if (event.target === event.currentTarget) closeAllModals()
}

// Test hook: lets Playwright open modals without steering the avatar into them.
// Gated on the URL (prod build), like window.__player.
if (new URLSearchParams(window.location.search).has("test")) {
    window.__openModal = (atomName, open = true) => {
        const atoms = {
            projects: isProjectModalVisibleAtom,
            experience: isExperienceModalVisibleAtom,
            skills: isSkillsModalVisibleAtom,
        }
        store.set(atoms[atomName], open)
    }
}
