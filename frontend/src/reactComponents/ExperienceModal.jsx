import { useAtomValue } from "jotai";
import { isExperienceModalVisibleAtom, experienceDataAtom, dismissOnBackdrop, closeAllModals } from "../store";

export default function ExperienceModal() {
  const experienceData = useAtomValue(experienceDataAtom);
  const isVisible = useAtomValue(isExperienceModalVisibleAtom);

  return (
    isVisible && (
      <div className="modal experience-modal" onClick={dismissOnBackdrop}>
        <div className="modal-content">
          <h1>{experienceData.title}</h1>
          <div className="experience-content">
            {experienceData.experiences.map((exp, index) => (
              <div key={index} className="experience-item">
                <h2>{exp.position}</h2>
                <h3>{exp.company}</h3>
                <p className="experience-duration">{exp.duration}</p>
                <p className="experience-description">{exp.description}</p>
              </div>
            ))}
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