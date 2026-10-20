import { useAtom, useAtomValue } from "jotai";
import { isSocialModalVisibleAtom, selectedLinkAtom, selectedLinkDescriptionAtom, dismissOnBackdrop } from "../store";

export default function SocialModal() { 
    const [isVisible, setIsVisible] = useAtom(isSocialModalVisibleAtom)
    const selectedLink = useAtomValue(selectedLinkAtom)
    const selectedLinkDescription = useAtomValue(selectedLinkDescriptionAtom)

    const buttons = [
        { id: 0,
            name: "Yes",
            handler: () => {
                window.open(selectedLink, "_blank")
                setIsVisible(false)
            }, 
        }, 
        {
            id: 1,
            name: "No",
            handler: () => {
                setIsVisible(false)
            },
        },
    ]

    return isVisible && (
        <div className="modal" onClick={dismissOnBackdrop}>
            <div className="modal-content">
                <h1>Do you want to open this link?</h1>
                <span>{selectedLink}</span>
                <p>{selectedLinkDescription}</p>
                <div className="modal-btn-container">
                    {buttons.map((button) => (
                        <button key={button.id} className="modal-btn" onClick={button.handler}>
                            {button.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}