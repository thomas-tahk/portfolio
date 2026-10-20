import { useAtomValue } from "jotai";
import { isSkillsModalVisibleAtom, skillsDataAtom, dismissOnBackdrop, closeAllModals } from "../store";

export default function SkillsModal() {
  const skillsData = useAtomValue(skillsDataAtom);
  const isVisible = useAtomValue(isSkillsModalVisibleAtom);

  return (
    isVisible && (
      <div className="modal skills-modal" onClick={dismissOnBackdrop}>
        <div className="modal-content">
          <h1>{skillsData.title}</h1>
          <p className="skills-interaction-hint">Close this and step off the section to start playing around with my tech stack!</p>
          <div className="skills-content">
            {skillsData.categories.map((category, index) => (
              <div key={index} className="skills-category">
                <h2>{category.name}</h2>
                <div className="skills-list">
                  {category.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className="skill-item">
                      {skill}
                    </span>
                  ))}
                </div>
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