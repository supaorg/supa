# Demo Spaces Workflow

## Overview

This proposal outlines a workflow for creating demo spaces from JSON files. This allows for easy creation of pre-configured spaces for demonstrations, testing, and onboarding.

## Workflow

1. **Create JSON file**: Define a demo space configuration in JSON format
2. **Run build script**: Execute `npm run build-demo-space <path-to-json>` from the root
3. **Script processes JSON**: Parses the JSON file, creates a Space in memory, and saves it to the file system

## JSON Schema

```json
{
  "type": "supa-space",
  "version": "1",
  "name": "Demo Workspace",
  "createdAt": "2024-01-15T10:30:00Z",
  "description": "Optional description of the demo space",
  
  "assistants": [
    {
      "id": "chat",
      "name": "Chat",
      "button": "New query",
      "visible": true,
      "description": "A basic chat assistant",
      "instructions": "You are Supa, an AI assistant. Be direct in all responses.",
      "targetLLM": "openai/gpt-4"
    }
  ],
  
  "providers": [
    // Only need provider ID and API key for cloud providers
    // Local providers like Ollama don't need API keys
    {
      "id": "openai",
      "apiKey": "sk-..."
    },
    {
      "id": "anthropic",
      "apiKey": "sk-ant-..."
    }
  ],
  
  "conversations": [
    {
      "title": "First conversation",
      "assistant": "chat",
      "messages": {
        "role": "user",
        "text": "Hello, can you help me with a coding question?",
        "createdAt": "2024-01-15T10:30:00Z",
        "main": true,
        "children": [
          {
            "role": "assistant",
            "text": "Of course! I'd be happy to help with your coding question. What are you working on?",
            "createdAt": "2024-01-15T10:30:05Z",
            "main": true,
            "children": [
              {
                "role": "user",
                "text": "I'm working on a React component that needs to handle state updates.",
                "createdAt": "2024-01-15T10:30:10Z",
                "main": true,
                "children": [
                  {
                    "role": "assistant",
                    "text": "Great! React state management can be tricky. Are you using hooks like useState, or do you need help with a specific state update pattern?",
                    "createdAt": "2024-01-15T10:30:15Z",
                    "main": true
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Implementation Plan

### 1. Create Build Scripts Package

Create a new package `packages/demo` that contains:
- Demo space builder utilities
- JSON schema validation
- CLI tools for space generation

Package structure:
```
packages/demo/
├── package.json
├── src/
│   ├── index.ts
│   ├── demo-space-builder.ts
│   ├── schema-validator.ts
│   └── cli.ts
└── examples/
    ├── getting-started.json
    ├── coding-assistant.json
    └── writing-helper.json
```

### 2. Build Script Implementation

The build scripts package will:
- Parse JSON files with proper schema validation
- Create new Space instances using `Space.newSpace(uuid())`
- Populate spaces with configurations using Space methods:
  - `addAppConfig()` for assistants
  - `saveModelProviderConfig()` for providers (handles API key separation)
  - `newAppTree()` and populate with conversations
- Save to file system using dual persistence (IndexedDB + FileSystem)
- Provide CLI interface for easy usage

### 3. Demo Space Builder Class

Create a utility class that handles:
- JSON schema validation
- Space creation and population
- File system persistence using the same patterns as ClientState

**Key Implementation Details:**

1. **Space Creation**: Use `Space.newSpace(uuid())` to create a new space
2. **Persistence Layers**: Use `createPersistenceLayersForURI()` to create IndexedDB + FileSystem layers
3. **Space Manager**: Use `SpaceManager.addNewSpace()` to save the space with persistence layers
4. **Provider Setup**: Use `space.saveModelProviderConfig()` which automatically handles API key separation
5. **App Trees**: Use `space.newAppTree()` to create conversation trees and populate with messages using `ChatAppData.newMessage()` for proper message structure

**Conversation Structure:**
Messages in Supa use a tree structure for branching support:
- Each message is a vertex with properties: `_n: "message"`, `role`, `text`, `createdAt`, `main`
- Messages are linked in a tree where children represent different conversation branches
- The `main` property indicates which branch is currently active (first child is main by default)
- The JSON directly represents the tree structure, making branching explicit and visible

**File System Structure:**
The demo space will be saved to a directory structure like:
```
output-path/
├── supa.md
└── space-v1/
    ├── space.json
    ├── secrets (encrypted)
    └── ops/
        ├── [space-id]/
        │   └── [year]/[month]/[day]/
        │       └── [peer-id].jsonl
        └── [app-tree-id]/
            └── [year]/[month]/[day]/
                └── [peer-id].jsonl
```

### 4. Example Demo Spaces

Create example JSON files in `packages/demo/examples/`:
- `getting-started.json` - Basic onboarding space
- `coding-assistant.json` - Programming-focused space
- `writing-helper.json` - Writing and editing space

## Usage Examples

```bash
# Build a demo space from JSON
npm run build-demo-space packages/demo/examples/getting-started.json

# Build and specify output directory
npm run build-demo-space packages/demo/examples/coding-assistant.json --output ~/Desktop/demo-space
```

## Integration with Supa

The generated demo spaces will be compatible with Supa's existing space loading mechanism:

1. **File System Structure**: Demo spaces follow the same structure as spaces created through Supa
2. **Persistence Layers**: Uses the same dual persistence (IndexedDB + FileSystem) as regular spaces
3. **Space Loading**: Can be opened in Supa using `clientState.loadSpace(path)` 
4. **Provider Integration**: API keys are properly stored in secrets and providers are configured
5. **Conversation Trees**: App trees are created with proper branching support

## Benefits

1. **Easy Demo Creation**: Quickly create consistent demo environments
2. **Version Control**: Demo configurations can be version controlled
3. **Reproducible**: Same demo space can be recreated anywhere
4. **Customizable**: Easy to modify demos for different audiences
5. **Testing**: Useful for testing different space configurations

## Future Enhancements

- Template system for common demo patterns
- CLI wizard for interactive demo creation
- Integration with CI/CD for automated demo generation
- Support for importing from other formats (Markdown, etc.) 