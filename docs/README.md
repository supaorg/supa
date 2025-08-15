# Sila Documentation

Welcome to Sila's documentation! This guide will help you understand the different features and components of Sila.

## Core Features

### [Spaces](./dev/spaces.md)
Spaces are the primary unit of user data in Sila. Learn about:
- RepTree CRDT system
- Space and App trees
- Persistence layers (IndexedDB, FileSystem)
- Secrets management
- Best practices for developers

### [Files in Spaces](./dev/files-in-spaces.md)
How Sila handles binary file storage and management:
- Content-addressed storage (CAS)
- Files AppTree for logical organization
- FileStore API for desktop
- Chat attachments integration
- On-disk layout and metadata

### [Testing](./dev/testing.md)
Testing infrastructure and practices in Sila:
- Vitest test suite
- File persistence testing
- Local assets for deterministic tests
- Running tests and development workflow

## Development

### [Project Structure](./dev/project-structure.md)
Overview of the monorepo structure and packages:
- Core, client, desktop, mobile packages
- Build system and workspace setup
- Tech stack overview

### [Quick Start](./dev/quick-start.md)
Get started with development:
- Prerequisites and setup
- Running the development environment
- Building from source

### [Space Management](./dev/space-management.md)
Managing workspaces and data:
- Creating and organizing spaces
- Data persistence and sync
- Workspace configuration

## Platform-Specific

### [macOS Notarization Setup](./dev/macos-notarization-setup.md)
Setting up code signing and notarization for macOS builds

## AI Development Guidelines

### [For AI Agents](./dev/for-ai/)
Guidelines and rules for AI-assisted development:
- [Rules](./dev/for-ai/rules.md) - Basic guidelines for AI agents
- [Svelte](./dev/for-ai/svelte.md) - Svelte 5 runes and patterns
- [Skeleton](./dev/for-ai/skeleton.md) - UI component system

## Proposals

See [proposals](./dev/proposals/) for feature proposals and design documents.

## Related Projects

Sila is built alongside several companion projects:
- **AI inference** - [aiwrapper](https://github.com/mitkury/aiwrapper)
- **Info about AI models** - [aimodels](https://github.com/mitkury/aimodels)
- **Tiling tabs** - [ttabs](https://github.com/mitkury/ttabs)
- **Sync** - [reptree](https://github.com/mitkury/reptree)
- **AI context** - [airul](https://github.com/mitkury/airul)
