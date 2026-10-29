import { useEditor } from './editor/store';
import { useShortcuts } from './editor/useShortcuts';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { LeftPanel } from './components/LeftPanel';
import { NewProject } from './components/NewProject';
import { TopBar } from './components/TopBar';

export default function App() {
  const hasProject = useEditor((s) => !!s.project);
  useShortcuts();

  if (!hasProject) return <NewProject />;

  return (
    <div className="app">
      <TopBar />
      <LeftPanel />
      <Canvas />
      <Inspector />
    </div>
  );
}
