import { useState, useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useOutlinerStore } from './store/useOutlinerStore';
import { NodeItem } from './components/NodeItem';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { LoginModal } from './components/LoginModal';
import { useVisibleNodes } from './hooks/useVisibleNodes';
import { isMatch } from './utils/keybindings';

function App() {
  const rootNodeId = useOutlinerStore((state) => state.rootNodeId);
  const hoistedNodeId = useOutlinerStore((state) => state.hoistedNodeId);
  const activeRootId = hoistedNodeId || rootNodeId;
  const rootNode = useOutlinerStore((state) => state.nodes[activeRootId]);
  const addNode = useOutlinerStore((state) => state.addNode);
  const setHoistedNode = useOutlinerStore((state) => state.setHoistedNode);
  const settings = useOutlinerStore((state) => state.settings);
  const focusedId = useOutlinerStore((state) => state.focusedId);

  const flatNodes = useVisibleNodes();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Scroll to focused node OR flashed node
  const flashId = useOutlinerStore((state) => state.flashId);

  useEffect(() => {
    const targetId = flashId || focusedId;

    if (targetId && flatNodes.length > 0) {
      const index = flatNodes.findIndex(n => n.id === targetId);
      if (index !== -1) {
        requestAnimationFrame(() => {
          virtuosoRef.current?.scrollToIndex({
            index,
            align: 'center',
            behavior: 'smooth',
          });
        });
      }
    }
  }, [focusedId, flashId, flatNodes]); // Add flashId dependency

  // Global Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search
      if (isMatch(e, settings.keybindings.search)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keybindings]);

  // Auth Initialization
  const user = useOutlinerStore((state) => state.user);
  const initializeAuth = useOutlinerStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync Logic (Pull on load + Realtime)
  const pullFromCloud = useOutlinerStore((state) => state.pullFromCloud);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Pull
    pullFromCloud();

    // 2. Realtime Subscription
    // Listen for ANY change to the 'nodes' table for this user
    import('@/lib/supabase').then(({ supabase }) => {
      const channel = supabase
        .channel('public:nodes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nodes',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime change detected:', payload);
            // Avoid pulling if WE caused the change (checking IDs might be hard without timestamps)
            // For now, simple refetch strategy. 
            // To avoid loop (Push -> Realtime -> Pull -> Push?), ensure Pull doesn't trigger Push.
            // Push trigger is: state.nodes !== prevState.nodes.
            // Pull sets state.nodes. This WILL trigger push if not careful.
            // But syncSlice.pullFromCloud does NOT set isSyncing=true during the internal logic in a way that blocks push?
            // Actually, useOutlinerStore's subscriber checks: if (!useOutlinerStore.getState().isSyncing).
            // syncSlice sets isSyncing=true during pull. So it should be safe!
            pullFromCloud();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [user, pullFromCloud]);

  // TODO: Loading state
  if (!rootNode) return <div className="p-10">Loading...</div>;

  if (!user) {
    return <LoginModal />; // Force login for now (or make it optional based on requirement)
  }

  return (
    <div className="oo-app-container min-h-screen bg-white text-gray-900 p-10 max-w-4xl mx-auto">
      <header className="oo-header mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Own Outliner
        </h1>
        <div className="oo-toolbar flex gap-2">
          <button
            className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2"
            onClick={() => setIsSearchOpen(true)}
            title="Search (Cmd+P)"
          >
            🔍 Search
          </button>
          <button
            className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            onClick={() => setIsSettingsOpen(true)}
          >
            Settings ⚙️
          </button>
        </div>
      </header>

      <main className="oo-main pl-2">
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
            ref={virtuosoRef}
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
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
