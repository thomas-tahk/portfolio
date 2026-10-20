import { useAtomValue } from "jotai";
import { isAboutModalVisibleAtom, aboutDataAtom, dismissOnBackdrop, closeAllModals } from "../store";

export default function AboutModal() {
  const aboutData = useAtomValue(aboutDataAtom);
  const isVisible = useAtomValue(isAboutModalVisibleAtom);

  return (
    isVisible && (
      <div className="modal about-modal" onClick={dismissOnBackdrop}>
        <div className="modal-content">
          <div className="about-content">
            <div className="about-text">
              <h1>About {aboutData.name}</h1>
              <p>{aboutData.description}</p>
            </div>
            <div className="about-image">
              <img
                className="profile-photo"
                src={aboutData.profilePic}
                alt={`${aboutData.name} headshot`}
              />
            </div>
          </div>
          <div className="modal-btn-container">
            <button className="modal-btn" onClick={closeAllModals}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
}