import { useSetAtom } from "jotai"
import { resetPlazaRequestAtom } from "../store"

export default function ResetPlaza() {
    const requestReset = useSetAtom(resetPlazaRequestAtom)
    const reset = () => {
        requestReset((request) => request + 1)
        document.getElementById("game").focus()
    }

    return <button className="plaza-reset" onClick={reset}>Reset plaza</button>
}
