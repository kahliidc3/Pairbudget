# i18n Workflow

## Add a new translation key
1. Add key to `src/messages/en.json`.
2. Add same key path to `src/messages/fr.json`.
3. Add same key path to `src/messages/ar.json`.
4. Use `useTranslations('<namespace>')` in component/page.

## Add a new language
1. Create `src/messages/<locale>.json`.
2. Register locale in i18n config and route middleware.
3. Add locale to language selector.
4. Validate RTL behavior for Arabic-like locales if needed.

## Formatting guidance
- Currency: use `formatCurrency` from `src/lib/utils.ts`.
- Dates: use `formatDate` from `src/lib/utils.ts`.
- Avoid hardcoded text in components.

## Quality checks
Run:
```bash
npm run lint
npm run typecheck
npm run test
```
