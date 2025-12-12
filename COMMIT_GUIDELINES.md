
# 1. Feature-Based Atomic Commits
- **Do not** squash dissimilar changes into one commit.
- **Split** changes into logical units (e.g., Auth Setup, Sync Logic, Bug Fixes).
- Use `git add` selectively.

# 2. Convention
- Format: `TYPE (scope): English imperative title`
- Body: Korean description (Optional, include only if detail is needed).
- Types: `FEAT`, `FIX`, `CHORE`, `REFACTOR`, `DOCS`, `STYLE`.
- Example:
  ```
  FEAT (autosync): Implement debounced auto-save

  - Store 구독을 통해 3초간 입력이 없으면 자동 저장하도록 구현
  ```
