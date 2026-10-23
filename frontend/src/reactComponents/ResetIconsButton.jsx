import { useSetAtom } from "jotai"
import { resetIconsRequestAtom } from "../store"

export default function ResetIconsButton() {
    const requestReset = useSetAtom(resetIconsRequestAtom)

    return (
        <button className="reset-icons-btn" onClick={() => requestReset((n) => n + 1)}>
            Reset icons
        </button>
    )
}
