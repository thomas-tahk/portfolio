import { atom, createStore } from 'jotai';

// the part of the app where you 'run into' links to different sites
export const isSocialModalVisibleAtom = atom(false);
export const selectedLinkAtom = atom(null);
export const selectedLinkDescriptionAtom = atom("");

export const isEmailModalVisibleAtom = atom(false);
export const emailAtom = atom("tomtahk27@gmail.com");

export const isProjectModalVisibleAtom = atom(false);
export const chosenProjectDataAtom = atom({
    title: "Projects",
    projects: [
        {
            id: 0,
            name: "PlotPlan",
            description: "Solo hackathon submission — a planning tool for small-scale farmers that combines user inputs with AI-generated recommendations anchored on USDA data. Next.js 16, React 19, TypeScript, Tailwind v4, Anthropic SDK, Supabase.",
            links: [
                { id: 0, name: "GitHub", link: "https://github.com/thomas-tahk/plot-plan" },
                { id: 1, name: "Live", link: "https://plot-plan.vercel.app" }
            ]
        },
        {
            id: 1,
            name: "Amugonna",
            description: "Full-stack recipe recommendation app that surfaces results based on a user's available pantry ingredients. React/TypeScript/Vite frontend, Node/Express/PostgreSQL backend deployed to Digital Ocean.",
            links: [
                { id: 0, name: "GitHub", link: "https://github.com/thomas-tahk/amugonna" },
                { id: 1, name: "Live", link: "https://amugonna-client.vercel.app/" }
            ]
        },
        {
            id: 2,
            name: "Dormant",
            description: "Client-side sleep hygiene tracker built as a Health Data Innovators capstone. Exports FHIR R4 Bundles with LOINC-coded Observations for standards-compliant health data portability. Next.js 16, TypeScript, Tailwind v4, localStorage-only — no backend.",
            links: [
                { id: 0, name: "GitHub", link: "https://github.com/thomas-tahk/Dormant" },
                { id: 1, name: "Live", link: "https://dormant-rho.vercel.app/" }
            ]
        },
        {
            id: 3,
            name: "Shows4Us",
            description: "Performing arts discovery platform for finding, researching, and ticketing musicals and live events. React 19/TypeScript/Vite 7 frontend, Node/Express backend with PostgreSQL via Supabase, Ticketmaster Discovery API integration.",
            links: [
                { id: 0, name: "GitHub", link: "https://github.com/thomas-tahk/shows-for-us" },
                { id: 1, name: "Live", link: "https://shows-for-us.vercel.app/" }
            ]
        }
    ]
})

export const isAboutModalVisibleAtom = atom(false);
export const aboutDataAtom = atom({
    name: "Thomas Tahk",
    description: "Hi — I'm Thomas. By day I keep ~80,000 students and staff online as a service desk technician for Albuquerque Public Schools; by night I build full-stack web apps and the occasional game. Background in localization and logistics, microbiology degree from UC Berkeley, bilingual in English and Korean, and yes — this whole portfolio is a game on purpose.",
    profilePic: "/headshot.jpg"
})

export const isSkillsModalVisibleAtom = atom(false);
export const skillsDataAtom = atom({
    title: "Skills & Technologies",
    categories: [
        {
            name: "Frontend",
            skills: ["JavaScript", "TypeScript", "React", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Vite", "shadcn/ui"]
        },
        {
            name: "Backend",
            skills: ["Node.js", "Express.js", "PostgreSQL", "REST APIs", "Supabase", "Zod"]
        },
        {
            name: "Languages",
            skills: ["JavaScript", "TypeScript", "Python", "Java", "C++", "C", "GDScript"]
        },
        {
            name: "Tools & Platforms",
            skills: ["Git", "GitHub", "Docker", "Vercel", "Digital Ocean", "Anthropic SDK", "Mailgun", "Cloudinary"]
        },
        {
            name: "IT Support",
            skills: ["ServiceNow ITSM", "Active Directory", "Microsoft Entra/Azure", "Google Admin", "BeyondTrust", "Windows", "macOS", "ChromeOS"]
        }
    ]
})

export const isExperienceModalVisibleAtom = atom(false);
export const experienceDataAtom = atom({
    title: "Experience",
    experiences: [
        {
            company: "Albuquerque Public Schools Technology",
            position: "Service Desk Technician (IT Contractor)",
            duration: "October 2025 – Present",
            description: "Tier 1 IT support for ~80,000 users and 300,000 devices across 143 schools via ServiceNow ITSM. Manage incidents across Chromebooks, Windows/Mac laptops, iPads, and interactive displays using Active Directory, Microsoft Entra/Azure, Google Admin, and BeyondTrust."
        },
        {
            company: "KOG Games",
            position: "Localization Project Manager",
            duration: "December 2020 – January 2022",
            description: "Managed localized text across 3 live service products in 6+ languages. Helped re-localize 30,000+ lines of lost game text data to enable a successful relaunch, and bridged communication between the Korean development team and the global player community."
        },
        {
            company: "Jart America, Inc.",
            position: "Operations Manager",
            duration: "March 2014 – December 2019",
            description: "Coordinated international logistics and documentation for 100+ monthly import/export cases. Implemented workflow optimizations that improved case processing efficiency by 12%."
        },
        {
            company: "C2 Education",
            position: "Academic Tutor",
            duration: "September 2023 – January 2024",
            description: "One-on-one academic support for K-12 students, adapting teaching approaches to different learning styles and developing personalized goal-setting frameworks with students and parents."
        }
    ]
})

export const cameraZoomValueAtom = atom({value : 1})

export const store = createStore()