import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useOutlinerStore } from './store/useOutlinerStore';
import { NodeItem } from './components/NodeItem';
import { SettingsModal } from './components/SettingsModal';
import { useVisibleNodes } from './hooks/useVisibleNodes';

function App() {
  const rootNodeId = useOutlinerStore((state) => state.rootNodeId);
  const hoistedNodeId = useOutlinerStore((state) => state.hoistedNodeId);
  const activeRootId = hoistedNodeId || rootNodeId;
  const rootNode = useOutlinerStore((state) => state.nodes[activeRootId]);
  const addNode = useOutlinerStore((state) => state.addNode);
  const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);

  const flatNodes = useVisibleNodes();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!rootNode) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 p-10 max-w-4xl mx-auto">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Own Outliner
        </h1>
        <div className="flex gap-2">
          {/* ... buttons ... */}
          <button
            className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            Settings ⚙️
          </button>
        </div>
      </header>

      <main className="pl-2">
        {hoistedNodeId && (
          <div className="mb-4 text-sm text-gray-500 flex items-center gap-1">
            <span className="cursor-pointer hover:underline" onClick={() => setHoistedNode(null)}>Root</span>
            <span>/</span>
            <span className="font-medium text-gray-800">{rootNode.content || 'Untitled'}</span>
          </div>
        )}

        {flatNodes.length === 0 ? (
          <div
            className="text-gray-400 italic cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => addNode(activeRootId)}
          >
            Click to start typing...
          </div>
        ) : (
          <Virtuoso
            useWindowScroll
            data={flatNodes}
            itemContent={(_, node) => (
              <NodeItem key={node.id} id={node.id} level={node.level} />
            )}
          />
        )}
      </main>

      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Local-First Outliner Prototype
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
