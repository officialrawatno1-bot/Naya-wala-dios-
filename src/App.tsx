import React, { useState } from 'react';
import { MainHub } from './components/MainHub';
import { DiosWorkspace } from './components/DiosWorkspace';
import { ReviewFormatWorkspace } from './components/ReviewFormatWorkspace';
import { WebDataWorkspace } from './components/WebDataWorkspace';

export default function App() {
  const [activeProject, setActiveProject] = useState<string | null>(null);

  if (activeProject === 'dios' || activeProject === 'dios-aggregator') {
    return <DiosWorkspace onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'dios-review') {
    return <ReviewFormatWorkspace onBack={() => setActiveProject(null)} />;
  }

  if (activeProject === 'web-data') {
    return <WebDataWorkspace onBack={() => setActiveProject(null)} />;
  }

  return <MainHub onOpenProject={(id) => setActiveProject(id)} />;
}
