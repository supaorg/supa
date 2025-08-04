import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { NodeFileSystem } from './NodeFileSystem';
import { Space, SpaceManager, uuid, FileSystemPersistenceLayer } from "@supa/core";

interface DemoSpaceConfig {
  type: "supa-space";
  version: "1";
  name: string;
  createdAt: string;
  description?: string;
  assistants: AssistantConfig[];
  providers: ProviderConfig[];
  conversations: ConversationConfig[];
}

interface AssistantConfig {
  id: string;
  name: string;
  button: string;
  visible?: boolean;
  description: string;
  instructions: string;
  targetLLM?: string;
}

interface ProviderConfig {
  id: string;
  apiKey?: string;
}

interface ConversationConfig {
  title: string;
  assistant: string;
  messages: MessageNode;
}

interface MessageNode {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  main?: boolean;
  children?: MessageNode[];
}

export class SimpleDemoBuilder {
  async buildFromConfig(config: DemoSpaceConfig, outputPath: string): Promise<string> {
    console.log(`Building demo space: ${config.name}`);
    console.log(`Output path: ${outputPath}`);
    
    try {
      // Create new space using the real Space API
      const space = Space.newSpace(uuid());
      const spaceId = space.getId();
      
      // Set space name
      space.name = config.name;

      // Create Node.js file system and persistence layer
      const fs = new NodeFileSystem();
      const persistenceLayer = new FileSystemPersistenceLayer(outputPath, spaceId, fs);
      
      // Create space manager and add the space
      const spaceManager = new SpaceManager();
      await spaceManager.addNewSpace(space, [persistenceLayer]);

      // Add assistants using the real Space API
      for (const assistant of config.assistants) {
        const assistantConfig = {
          id: assistant.id,
          name: assistant.name,
          button: assistant.button,
          visible: assistant.visible ?? true,
          description: assistant.description,
          instructions: assistant.instructions,
          targetLLM: assistant.targetLLM
        };
        space.addAppConfig(assistantConfig);
      }

      // Add providers using the real Space API
      for (const provider of config.providers) {
        if (provider.apiKey) {
          const providerConfig = {
            id: provider.id,
            type: "cloud" as const,
            apiKey: provider.apiKey
          };
          space.saveModelProviderConfig(providerConfig);
        }
      }

      // Add conversations using the real Space API
      for (const conversation of config.conversations) {
        const appTree = space.newAppTree(conversation.assistant);
        space.setAppTreeName(appTree.getId(), conversation.title);
        
        // Add messages to the conversation
        this.addMessagesToConversation(appTree, conversation.messages);
      }

      console.log(`✅ Demo space created successfully!`);
      console.log(`📁 Output: ${outputPath}`);
      console.log(`🆔 Space ID: ${spaceId}`);
      console.log(`\n💡 You can now open this space in Supa!`);
      
      // Log what was created
      console.log(`\n📋 Space contents:`);
      console.log(`- Assistants: ${config.assistants.length}`);
      config.assistants.forEach(assistant => {
        console.log(`  • ${assistant.name} (${assistant.id})`);
      });
      
      console.log(`- Providers: ${config.providers.length}`);
      config.providers.forEach(provider => {
        console.log(`  • ${provider.id}${provider.apiKey ? ' (with API key)' : ''}`);
      });
      
      console.log(`- Conversations: ${config.conversations.length}`);
      config.conversations.forEach(conversation => {
        console.log(`  • ${conversation.title} (assistant: ${conversation.assistant})`);
      });
      
      return spaceId;
    } catch (error) {
      console.error('Error creating space:', error);
      throw error;
    }
  }

  addMessagesToConversation(appTree: any, messageNode: MessageNode): void {
    // Convert ISO date string to milliseconds
    const createdAt = new Date(messageNode.createdAt).getTime();

    // Create message vertex using the real AppTree API
    const messageVertex = appTree.tree.newVertex(appTree.tree.root.id, {
      _n: "message",
      role: messageNode.role,
      text: messageNode.text,
      createdAt: createdAt,
      main: messageNode.main ?? true
    });

    // Add children recursively
    if (messageNode.children) {
      for (const child of messageNode.children) {
        this.addMessagesToConversation(appTree, child);
      }
    }
  }
} 