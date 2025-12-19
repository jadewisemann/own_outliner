# Alt+Arrow Node Movement 기능 명세

## 목표
아웃라이너에서 `Alt+Up` / `Alt+Down` 키로 노드를 시각적 순서 기반으로 이동하되, 아웃라이너의 depth 규칙(인접 노드와 최대 1 depth 차이)을 유지하도록 자동 조정하는 기능 구현.

---

## 핵심 원칙

1. **시각적 순서로 이동**: flatList(depth-first 순회)에서 한 칸 위/아래로 이동
2. **Depth 자동 조정**: 이동 후 인접 노드와 depth 차이가 1보다 크면 depth를 조정
3. **이동 금지 케이스 없음**: 항상 이동 가능, depth만 필요시 조정
4. **자식 유지**: 이동하는 노드의 subtree(자식들)는 그대로 함께 이동
5. **다른 노드 불변**: 이동하지 않는 노드들의 구조는 변경하지 않음

---

## Alt+Up 알고리즘

```
1. flatList 생성 (시각적 순서)
2. current = 이동할 노드
   prev = current 바로 위 노드
   newPrev = prev 바로 위 노드 (이동 후 current의 위 노드가 됨)

3. 분기 처리:
   a) current.depth > prev.depth:
      → prev 앞에 삽입 (prev의 형제가 됨)
      → 예: a > b > c에서 c Alt+Up → a > c, b
   
   b) current.depth <= prev.depth:
      → targetDepth = min(current.depth, newPrev.depth + 1)
      → targetDepth === 0: root 레벨에 삽입
      → targetDepth === newPrev.depth + 1: newPrev의 마지막 자식으로 삽입
      → 예: a > b, c > d에서 d Alt+Up → a > b, d, c
```

---

## 테스트 케이스

| Before | 동작 | After |
|--------|------|-------|
| `a > b > c, d` | c Alt+Up | `a > c, b, d` |
| `a > b, c > d` | d Alt+Up | `a > b, d, c` |
| `z, a > b` | b Alt+Up | `z > b, a` |
| `a > b` | b Alt+Up | `b, a` |
| `a > b, c` | c Alt+Up | `a > c, b` (형제 swap) |

---

## 데이터 구조

```typescript
// flatList 노드 구조
interface FlatNode {
  id: string;
  depth: number;
  parentId: string;
}

// Yjs 기반 노드 조작
// - children.delete(index, 1): 부모에서 제거
// - children.insert(index, [id]): 새 부모에 삽입
// - node.set('parentId', newParentId): parentId 업데이트
```

---

## 주의사항
- Alt+Down도 동일한 원칙으로 구현 필요 (방향만 반대)
- collapsed 노드의 자식은 flatList에 포함하지 않음
- 형제 노드끼리의 순서만 바뀌는 경우는 depth 변경 없이 단순 swap
