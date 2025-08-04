# Demo Spaces Workflow

## Overview

This proposal outlines a workflow for creating demo spaces from JSON files. This allows for easy creation of pre-configured spaces for demonstrations, testing, and onboarding.

## Workflow

1. **Create JSON file**: Define a demo space configuration in JSON format
2. **Run build script**: Execute `npm run build-demo-space <path-to-json>` from the root
3. **Script processes JSON**: Parses the JSON file, creates a Space in memory, and saves it to the file system
4. **Open in Supa**: Run Supa and open the generated space for demos

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
        // Messages are represented as a tree structure to support branching
        // The first child in each array represents the active/current branch
        "role": "user",
        "content": "Hello, can you help me with a coding question?",
        "createdAt": "2024-01-15T10:30:00Z",
        "children": [
          {
            "role": "assistant",
            "content": "Of course! I'd be happy to help with your coding question. What are you working on?",
            "createdAt": "2024-01-15T10:30:05Z",
            "children": [
              {
                "role": "user",
                "content": "I'm working on a React component that needs to handle state updates.",
                "createdAt": "2024-01-15T10:30:10Z",
                "children": [
                  {
                    "role": "assistant",
                    "content": "Great! React state management can be tricky. Are you using hooks like useState, or do you need help with a specific state update pattern?",
                    "createdAt": "2024-01-15T10:30:15Z"
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

Create a new package `packages/build-scripts` that contains:
- Demo space builder utilities
- JSON schema validation
- CLI tools for space generation

Package structure:
```
packages/build-scripts/
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
- Create new Space instances using the core package
- Populate spaces with configurations
- Save to file system using FileSystemPersistenceLayer
- Provide CLI interface for easy usage

### 3. Demo Space Builder Class

Create a utility class that handles:
- JSON schema validation
- Space creation and population
- File system persistence

### 4. Example Demo Spaces

Create example JSON files in `packages/build-scripts/examples/`:
- `getting-started.json` - Basic onboarding space
- `coding-assistant.json` - Programming-focused space
- `writing-helper.json` - Writing and editing space

## Usage Examples

```bash
# Build a demo space from JSON
npm run build-demo-space packages/build-scripts/examples/getting-started.json

# Build and specify output directory
npm run build-demo-space packages/build-scripts/examples/coding-assistant.json --output ~/Desktop/demo-space
```

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