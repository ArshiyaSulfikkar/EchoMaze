# EchoMaze AI Agent Guide

This repository is a web-based accessibility game designed to help visually impaired users navigate a 2D maze using spatial audio cues, voice guidance, and keyboard controls. The project theme is inclusion-first interaction design: audio and speech should carry the experience, not merely decorate it.

## Project context

- See [README.md](README.md) for the high-level overview and team context.
- The active prototype lives in [prototype/README.md](prototype/README.md) and the browser code in [prototype/main.js](prototype/main.js), [prototype/GameScene.js](prototype/GameScene.js), and [prototype/index.html](prototype/index.html).
- Keep the repository structure in mind: [prototype/](prototype/) is the current working area, while [assets/](assets/), [client/](client/), and [server/](server/) are the broader app areas for later product expansion.

## Core theme and conventions

- Prioritize accessibility over purely visual polish.
- Treat spatial audio, verbal prompts, and keyboard-first control as primary interaction patterns.
- Avoid adding features that only work with a mouse or screen-based feedback.
- Prefer explicit, testable behavior over hidden assumptions about player ability or device setup.
- Keep changes small and focused; the project is a prototype-driven app, so iteration is more important than large architectural rewrites.

## When working in this repo

- Start by checking [README.md](README.md) and the prototype documentation before changing gameplay, audio, or controls.
- If you are touching maze behavior, sound cues, or UX flow, keep the experience understandable without visual feedback.
- If you add new files, match the existing lightweight structure and keep names descriptive.
- Do not introduce visual-only shortcuts or motion cues that fail without a screen-based workflow.

## Validation expectations

- Verify prototype changes in the browser using the existing front-end flow whenever possible.
- Prefer small, isolated patches and validate the specific behavior you changed.
- Keep client/server responsibilities clean if production layers are introduced later.

## Guidance for AI coding agents

- If a request seems to conflict with the accessibility theme, default to the inclusive interaction approach.
- Favor incremental improvements to the maze prototype and sound-based navigation model over large refactors.
- When in doubt, preserve the project’s foundational goal: helping users navigate through sound, guidance, and clear interaction cues.
