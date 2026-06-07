# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dota Core — a Vue 3 + TypeScript dota 2 tournament management SPA. Pinia for state, Element Plus for UI, TailwindCSS for styling, Pinia Colada for server-state, Vite.

## Required reading

- **[`architecture.md`](./architecture.md)** — layer dependency rules, views vs features, project structure, auto-imports, modals, routing, icons, styling, naming, hard rules. Read this first before writing code.

## Architecture compliance

`architecture.md` is **mandatory** for all new code. Legacy code that predates the current rules may not match the structure — when editing such code, leave the surrounding structure as-is rather than opportunistically rewriting it. New features, new modules, and net-new files must follow `architecture.md` exactly.

If you find an inconsistency between `architecture.md` and the codebase (or between `architecture.md` and a request), **stop and flag it** — do not silently pick a side. We decide together whether to update the doc, refactor the code, or scope the change.

There is no test runner configured.

## Tooling notes

- Build artifacts and the bundle visualizer (`dist/`, `stats.html`) are committed in places — leave them alone unless explicitly building.
