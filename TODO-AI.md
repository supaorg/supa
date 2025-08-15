# TODO-AI: Sila Development Tracking

This file tracks completed tasks and new developments for AI agents working on the Sila project.

## Recently Completed

### Documentation Structure (Current Session)
- ✅ **Created main documentation index** (`docs/index.md`)
  - Added comprehensive links to all feature documentation
  - Organized docs by category (Core Features, Development, Platform-Specific, etc.)
  - Included references to related projects and AI development guidelines

- ✅ **Created comprehensive testing documentation** (`docs/dev/testing.md`)
  - Based on `packages/tests/README.md` with expanded details
  - Added sections for test structure, development workflow, and best practices
  - Included troubleshooting guide and common issues
  - Added TODO section for missing documentation areas

- ✅ **Updated main README** to reference new documentation structure
  - Added link to full documentation from developer section

## Current Development Areas

### High Priority Documentation Needs
- [ ] **API Testing Documentation**: Guide for testing core API endpoints and services
- [ ] **UI Component Testing**: Documentation for testing Svelte components and user interactions
- [ ] **Integration Testing**: End-to-end testing strategies for desktop and mobile apps
- [ ] **Performance Testing**: Guidelines for testing performance and memory usage
- [ ] **Error Handling Tests**: Documentation for testing error conditions and edge cases

### Medium Priority Documentation Needs
- [ ] **Mocking Strategies**: How to mock external dependencies (AI providers, file system)
- [ ] **Test Data Management**: Best practices for managing test fixtures and data
- [ ] **Continuous Integration**: CI/CD testing pipeline documentation
- [ ] **Test Coverage**: Setting up and maintaining test coverage metrics

### Feature Documentation Gaps
- [ ] **Authentication System**: Documentation for the auth components and flow
- [ ] **Theme System**: How themes work and how to create custom themes
- [ ] **Model Management**: Documentation for AI model configuration and providers
- [ ] **Desktop App Development**: Electron-specific development guidelines
- [ ] **Mobile App Development**: Capacitor-specific development guidelines

## Development Guidelines for AI Agents

### Documentation Standards
- Use markdown format with clear headings and structure
- Include code examples where appropriate
- Link to related documentation
- Add TODO sections for missing areas
- Follow the existing documentation style in `docs/dev/`

### Code Standards
- Follow the commit message format: `type(scope): description`
- Use Svelte 5 runes syntax (see `docs/dev/for-ai/svelte.md`)
- Use lucide-svelte icons for UI components
- Follow the project structure and package organization

### Testing Requirements
- Write tests for new features
- Use the existing test structure in `packages/tests/`
- Add local assets for file-related tests
- Ensure tests are deterministic and offline-capable

## Project Context

### Key Technologies
- **Frontend**: Svelte 5 + SvelteKit
- **Desktop**: Electron
- **Mobile**: Capacitor
- **Styling**: Tailwind CSS + Skeleton design system
- **Testing**: Vitest
- **Build**: Vite

### Core Concepts
- **Spaces**: Primary unit of user data with CRDT-based RepTree
- **Files**: Content-addressed storage (CAS) with Files AppTree for metadata
- **Apps**: Application-specific trees (chat, files, etc.)
- **Persistence**: Multi-layer persistence (IndexedDB, FileSystem)

### Related Projects
- **aiwrapper**: AI inference
- **aimodels**: AI model information
- **ttabs**: Tiling tabs system
- **reptree**: Sync and CRDT implementation
- **airul**: AI context generation

## Notes for Future Development

- Always check existing documentation before creating new docs
- Update this TODO-AI.md file after completing major tasks
- Follow the established patterns in the codebase
- Consider both desktop and mobile platforms when implementing features
- Maintain backward compatibility when possible
- Test thoroughly with the existing test suite
