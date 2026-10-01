import React, { useState } from 'react';
import { MainHub } from './components/MainHub';
import { DiosWorkspaceV2 } from './components/DiosWorkspace_v2';
import { ReviewFormatWorkspaceV2 } from './components/ReviewFormatWorkspace_v2';
import { WebDataWorkspace } from './components/WebDataWorkspace';
import { DailyWorkingWorkspace } from './components/DailyWorkingWorkspace';
import { DoctorCampWorkspace } from './components/DoctorCampWorkspace';

export default function App() {
  const [activeProject, setActiveProject] = useState<string | null>(null);

  if (activeProject === 'camp-hub') {
    return <DoctorCampWorkspace onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'dios' || activeProject === 'dios-aggregator') {
    return <DiosWorkspaceV2 onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'dios-review') {
    return <ReviewFormatWorkspaceV2 onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'daily-working') {
    return <DailyWorkingWorkspace onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'web-data') {
    return <WebDataWorkspace onBack={() => setActiveProject(null)} />;
  }

  return <MainHub onOpenProject={(id) => setActiveProject(id)} />;
}
