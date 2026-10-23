import { useAtomValue, useAtom } from "jotai";
import { isProjectModalVisibleAtom, chosenProjectDataAtom, dismissOnBackdrop } from "../store";

export default function ProjectModal() {
  const projectData = useAtomValue(chosenProjectDataAtom);
  const [isVisible, setIsVisible] = useAtom(isProjectModalVisibleAtom);

  return (
    isVisible && (
      <div className="modal projects-modal" onClick={dismissOnBackdrop}>
        <div className="modal-content">
          <h1>{projectData.title}</h1>
          <div className="projects-list">
            {projectData.projects.map((project) => (
              <div key={project.id} className="project-item">
                <h2>{project.name}</h2>
                <p className="project-description">{project.description}</p>
                <div className="project-links">
                  {project.links.map((linkData) => (
                    <button
                      key={linkData.id}
                      className={"modal-btn project-link-btn"}
                      onClick={() => {
                        window.open(linkData.link, "_blank");
                      }}
                    >
                      {linkData.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-btn-container">
            <button
              className={"modal-btn"}
              onClick={() => {
                setIsVisible(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
}
