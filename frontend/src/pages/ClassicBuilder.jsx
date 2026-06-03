import { useState, useEffect } from "react";
import { ProjectService } from "../services/AppServices";
import GrapesJSEditor from "../components/editor";

/**
 * ClassicBuilderView
 * Envoltorio (Wrapper) para el editor GrapesJS original.
 * Inicializa el editor para construir Landing Pages tradicionales.
 */
export default function ClassicBuilderView({ projectId, clientId, onBack }) {
  const [projectData, setProjectData] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved");

  useEffect(() => {
    if (projectId && clientId) {
      ProjectService.getProjectById(projectId, clientId).then((data) => {
        if (data.project) {
          setProjectName(data.project.name);
          setProjectData(data.project.json_data || {});
          setLoading(false);
        }
      });
    }

    // Listen for custom event from GrapesJSEditor's back button
    const handleBack = () => onBack();
    window.addEventListener('kiuflow-back-to-landings', handleBack);
    return () => window.removeEventListener('kiuflow-back-to-landings', handleBack);
  }, [projectId, clientId, onBack]);

  const handleManualSave = async (editorInstance, newName) => {
    if (!editorInstance) return;
    setSaveStatus("saving");
    try {
      const pData = editorInstance.getProjectData();
      const html = editorInstance.getHtml();
      const css = editorInstance.getCss();
      const finalName = newName !== undefined ? newName : projectName;
      await ProjectService.saveProject(projectId, clientId, pData, html, css, finalName);
      if (newName !== undefined) setProjectName(newName);
      setSaveStatus("saved");
    } catch (e) {
      console.error("Error saving project", e);
      setSaveStatus("unsaved");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b] text-white">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <span className="text-zinc-500 text-sm font-medium">Cargando proyecto...</span>
      </div>
    );
  }

  // We pass initialData and a ref/callback so the editor can trigger saves.
  return (
    <div className="flex flex-col h-screen w-full absolute inset-0 z-50">
      <GrapesJSEditor 
        initialData={projectData} 
        projectName={projectName}
        saveStatus={saveStatus}
        onSave={handleManualSave}
      />
    </div>
  );
}
