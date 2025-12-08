import { useOutlinerStore } from './store/useOutlinerStore';
import { NodeItem } from './components/NodeItem';

function App() {
  const rootNodeId = useOutlinerStore((state) => state.rootNodeId);
  const hoistedNodeId = useOutlinerStore((state) => state.hoistedNodeId);
  const activeRootId = hoistedNodeId || rootNodeId;
  const rootNode = useOutlinerStore((state) => state.nodes[activeRootId]);
  const addNode = useOutlinerStore((state) => state.addNode);
  const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);

  const settings = useOutlinerStore((state) => state.settings);
  const setSetting = useOutlinerStore((state) => state.setSetting);

  if (!rootNode) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 p-10 max-w-4xl mx-auto">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Own Outliner
        </h1>
        <div className="text-xs flex gap-2">
          <button
            className={`px-2 py-1 rounded border ${settings.splitBehavior === 'auto' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}
            onClick={() => setSetting('splitBehavior', 'auto')}
          >
            Split: Auto
          </button>
          <button
            className={`px-2 py-1 rounded border ${settings.splitBehavior === 'sibling' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}
            onClick={() => setSetting('splitBehavior', 'sibling')}
          >
            Sibling
          </button>
          <button
            className={`px-2 py-1 rounded border ${settings.splitBehavior === 'child' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}
            onClick={() => setSetting('splitBehavior', 'child')}
          >
            Child
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
        {rootNode.children.length === 0 ? (
          <div
            className="text-gray-400 italic cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => addNode(activeRootId)}
          >
            Click to start typing...
          </div>
        ) : (
          rootNode.children.map((childId) => (
            <NodeItem key={childId} id={childId} level={0} />
          ))
        )}
      </main>

      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Local-First Outliner Prototype
      </div>
    </div>
  );
}

export default App;
