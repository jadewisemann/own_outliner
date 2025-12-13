import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash-es';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useOutlinerStore } from './store/useOutlinerStore';
import { NodeItem } from './components/NodeItem';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { LoginModal } from './components/LoginModal';
import { MainLayout } from './components/layout/MainLayout';
import { SlashMenu } from '@/components/editor/SlashMenu';
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
  const indentNode = useOutlinerStore((state) => state.indentNode);
  const outdentNode = useOutlinerStore((state) => state.outdentNode);

  const slashMenu = useOutlinerStore((state) => state.slashMenu);
  const setSlashMenu = useOutlinerStore((state) => state.setSlashMenu);
  const updateType = useOutlinerStore((state) => state.updateType);

  const flatNodes = useVisibleNodes();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  // ... existing code ...


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
  }, [focusedId, flashId, flatNodes]);

  // Global Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search
      if (isMatch(e, settings.keybindings.search)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    const handleFocusHeader = () => {
      headerInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('outliner:focus-header', handleFocusHeader);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('outliner:focus-header', handleFocusHeader);
    };
  }, [settings.keybindings]);

  // Auth Initialization
  const user = useOutlinerStore((state) => state.user);
  const initializeAuth = useOutlinerStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync Logic (CRDT / Yjs)
  const initializeSync = useOutlinerStore((state) => state.initializeSync);

  useEffect(() => {
    if (!user) return;
    initializeSync(); // Starts Yjs provider
  }, [user, initializeSync]);

  // if (!rootNode) return <div className="p-10 text-slate-400">Loading...</div>; // Moved inside

  // Mobile Toolbar Handlers
  const handleAddNode = () => {
    // Add to bottom or focused? 
    // Default to adding to root at end if no focus, or handled by addNode logic
    if (activeRootId) addNode(activeRootId);
  };

  const handleIndent = () => {
    if (focusedId) indentNode(focusedId);
  };
  const handleOutdent = () => {
    if (focusedId) outdentNode(focusedId);
  };

  // Header Inputs - MOVING HOOKS UP
  const documents = useOutlinerStore((state) => state.documents);
  const activeDocumentId = useOutlinerStore((state) => state.activeDocumentId);
  const setFocus = useOutlinerStore((state) => state.setFocus);

  const activeDocument = documents.find(d => d.id === activeDocumentId);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Title Logic (Local State for smooth typing + Debounce for DB)
  const currentTitle = hoistedNodeId && rootNode ? rootNode.content : (activeDocument?.title || '');
  const [localTitle, setLocalTitle] = useState(currentTitle);
  const isTitleDirty = useRef(false);

  // Sync localTitle 
  useEffect(() => {
    if (!isTitleDirty.current) {
      setLocalTitle(currentTitle);
    }
  }, [currentTitle]);

  // Reset dirty flag when switching context (Zoom in/out or Doc switch)
  useEffect(() => {
    isTitleDirty.current = false;
    setLocalTitle(currentTitle); // Instant sync to new context
  }, [hoistedNodeId, activeDocumentId]);

  // Debounced Save for Document Rename ONLY
  const debouncedRename = useRef(
    debounce((id: string, title: string) => {
      useOutlinerStore.getState().renameDocument(id, title);
    }, 500)
  ).current;

  // Clean up debounce
  useEffect(() => {
    return () => {
      debouncedRename.cancel();
    };
  }, [debouncedRename]);

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    isTitleDirty.current = true;

    if (hoistedNodeId && rootNode) {
      // Direct update for Node Content (No Debounce requested)
      useOutlinerStore.getState().updateContent(hoistedNodeId, newTitle); // Fixed: Use hoistedNodeId
      // We should also set isTitleDirty to false immediately if we want rapid updates to reflect? 
      // Actually `updateContent` updates Yjs -> triggers store update -> `currentTitle` changes -> effect runs.
      // But since we are typing, `isTitleDirty` is true, so effect won't overwrite us. Good.
    } else if (activeDocumentId) {
      // Debounce for Document Rename
      debouncedRename(activeDocumentId, newTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      // Focus first visible node
      if (flatNodes.length > 0) {
        setFocus(flatNodes[0].id);
      } else if (activeRootId) {
        // If empty, create first node
        addNode(activeRootId);
      }
    }
  };

  const breadcrumbs = hoistedNodeId ? (
    <span className="cursor-pointer hover:text-slate-700 hover:underline" onClick={() => setHoistedNode(null)}>
      {activeDocument?.title || 'Home'}
    </span>
  ) : null;

  // -- EARLY RETURNS AFTER HOOKS --

  // if (!rootNode) return <div className="p-10 text-slate-400">Loading...</div>; // Moved inside

  if (!user) {
    return <LoginModal />;
  }

  return (
    <MainLayout
      title={localTitle}
      onTitleChange={handleTitleChange}
      onTitleKeyDown={handleTitleKeyDown}
      headerInputRef={headerInputRef}
      breadcrumbs={breadcrumbs}
      onAddNode={handleAddNode}
      onIndent={handleIndent}
      onOutdent={handleOutdent}
      onSearch={() => setIsSearchOpen(true)}
      onSettings={() => setIsSettingsOpen(true)}
    >
      {!rootNode ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <p>문서를 선택하거나 새로 만드세요.</p>
        </div>
      ) : (
        <>
          {/* Hoisted Node Indicator removed from here as it is now in header */}

          {flatNodes.length === 0 ? (
            <div
              className="text-slate-400 italic cursor-pointer hover:bg-slate-50 p-2 rounded"
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
        </>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {slashMenu.isOpen && slashMenu.position && (
        <SlashMenu
          position={slashMenu.position}
          onClose={() => setSlashMenu({ isOpen: false, position: null, targetNodeId: null })}
          onSelect={(type) => {
            if (slashMenu.targetNodeId) {
              updateType(slashMenu.targetNodeId, type);
            }
          }}
        />
      )}
    </MainLayout>
  );
}

export default App;
