import React, { useState } from 'react';
import { MainHub } from './components/MainHub';
import { DiosWorkspace } from './components/DiosWorkspace';
import { ReviewFormatWorkspace } from './components/ReviewFormatWorkspace';
import { WebDataWorkspace } from './components/WebDataWorkspace';

export default function App() {
  const [activeProject, setActiveProject] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('dios_active_project') || null;
    } catch {
      return null;
    }
  });

  const handleSetActiveProject = (id: string | null) => {
    setActiveProject(id);
    try {
      if (id) sessionStorage.setItem('dios_active_project', id);
      else {
        sessionStorage.removeItem('dios_active_project');
        sessionStorage.removeItem('dios_web_data_view');
      }
    } catch {}
  };

  if (activeProject === 'dios' || activeProject === 'dios-aggregator') {
    return <DiosWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  if (activeProject === 'dios-review') {
    return <ReviewFormatWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  if (activeProject === 'web-data') {
    return <WebDataWorkspace onBack={() => handleSetActiveProject(null)} />;
  }

  return <MainHub onOpenProject={handleSetActiveProject} />;
}
