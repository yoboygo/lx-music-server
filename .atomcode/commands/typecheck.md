# /typecheck Command

Run TypeScript type checking for the project.

## Steps

1. Run the type checker:
   ```bash
   npx tsc --noEmit
   ```

2. If there are errors, analyze them and suggest fixes based on the project conventions (see `.atomcode/skills/project-conventions/SKILL.md`).

3. If no errors, confirm the codebase is type-safe.

## Notes

- The project uses `strict: true` in `tsconfig.json`
- Path alias `@/` maps to `src/`
- Type declarations are in `src/types/*.d.ts` (ambient `LX.*` namespaces)
