@AGENTS.md

## Claude Code specifics

- Prefer the local CLI from source: `pnpm growthos <command>`.
- Run `pnpm test` after changing core, CLI, or MCP behavior.
- The demo acceptance output lives in `packages/cli/test/demo.test.ts`. If you change the demo, update that test, the README, and `scripts/validate-fixtures.ts` together.
- Use the `growthos` skill in `skills/growthos/SKILL.md` when working on the repo's own marketing, not just its code.
