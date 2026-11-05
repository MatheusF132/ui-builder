import { useEffect, useState } from 'react';
import { useEditor } from './editor/store';
import { useShortcuts } from './editor/useShortcuts';
import { useAppearance } from './editor/ui';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { LeftPanel } from './components/LeftPanel';
import { NewProject } from './components/NewProject';
import { Prototype } from './components/Prototype';
import { Shortcuts } from './components/Shortcuts';
import { TopBar } from './components/TopBar';

export default function App() {
  const hasProject = useEditor((s) => !!s.project);
  const [help, setHelp] = useState(false);
  const [proto, setProto] = useState(false);
  useShortcuts();
  useAppearance();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) setHelp((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!hasProject) return <NewProject />;

  return (
    <div className="app">
      <TopBar onHelp={() => setHelp(true)} onPrototype={() => setProto(true)} />
      <LeftPanel />
      <Canvas />
      <Inspector />
      {help && <Shortcuts onClose={() => setHelp(false)} />}
      {proto && <Prototype onClose={() => setProto(false)} />}
    </div>
  );
}
