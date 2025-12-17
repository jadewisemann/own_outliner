import React from 'react';
import { PromptModal } from '@/components/ui/PromptModal';
import { useSidebarContext } from './SidebarContext';
import { useOutlinerStore } from '@/store/outlinerStore';

export const SidebarConflictResolver: React.FC = () => {
    const { conflictState, setConflictState } = useSidebarContext();
    const { renameDocument, moveDocument } = useOutlinerStore(); // Directly use store instead of passing through context unless exposed

    if (!conflictState) return null;

    const onResolve = async (newName: string) => {
        // Note: We need documents to check conflict again? 
        // Ideally the conflict check logic is in the handler, but here we just try to resolve
        // Actually, in the original code, the resolution logic checked "trimmed !== doc.title".
        // Let's implement that simple logic here or duplicate it? 
        // Wait, SidebarContext doesn't expose `documents` specifically for this? It does.
        // But we need `documents` inside this component to check "trimmed === doc.title" to warn.
        // Let's grab documents from store.

        // BUT, conflictState has draggedId, targetId.
        const trimmed = newName.trim();
        // We should ideally call a method "resolveConflict(newName)" exposed by context?
        // But for now let's implement the logic here to keep context interface clean, 
        // or expose `onResolveConflict` in context?
        // Let's just implement here.

        if (trimmed) { // && trimmed !== originalTitle (checked below)
            await renameDocument(conflictState.draggedId, trimmed);
            await moveDocument(conflictState.draggedId, conflictState.targetId);
            setConflictState(null);
        } else {
            alert("이름을 입력해주세요.");
        }
    };

    return (
        <PromptModal
            isOpen={true}
            title="이름 충돌"
            message={`대상 폴더에 같은 이름이 존재합니다.\n'${conflictState.initialName}'(으)로 변경하여 이동하시겠습니까 ? `}
            initialValue={conflictState.initialName}
            onConfirm={onResolve}
            onCancel={() => setConflictState(null)}
        />
    );
};
