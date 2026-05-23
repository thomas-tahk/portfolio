import {useAtom, useAtomValue} from "jotai";
import { useState } from "react";
import { isEmailModalVisibleAtom, emailAtom } from "../store";

export default function EmailModal() {
    const [isVisible, setIsVisible] = useAtom(isEmailModalVisibleAtom)
    const email = useAtomValue(emailAtom)

    const [onCopyMessage, setOnCopyMessage] = useState("")

    const buttons = [
        {
            id: 0,
            name: "Yes",
            handler: () => {
                navigator.clipboard.writeText(email);
                setOnCopyMessage("Email copied to clipboard!")
            },
        },
        {
            id: 1,
            name: "No",
            handler: () => {
                setIsVisible(false)
            },
        }
    ]

    return (
        isVisible && (
            <div className="modal">
                <div className="modal-content">
                    <h1>Copy my email to your clipboard?</h1>
                    <span>{email}</span>
                    <p>{onCopyMessage}</p>
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
    )
}