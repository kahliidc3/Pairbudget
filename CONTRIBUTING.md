# Contributing

## Branch naming
- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Commit messages
Use Conventional Commits:
- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

Commit messages are validated by commitlint via Husky `commit-msg` hook.

## Local quality gates
Before opening a PR, run:
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Pull request checklist
- Scope is focused and minimal.
- Tests added/updated for behavior changes.
- i18n keys added for new UI strings.
- No secrets committed.
- Backlog/checklist updated if task is completed.

## Code style
- TypeScript-first, strict typing.
- Prefer small pure functions over large components.
- Keep service errors user-safe and logged with context.
- Keep accessibility (labels, keyboard, ARIA) intact.
