import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class SimpleDemoBuilder {
  async buildFromConfig(config, outputPath) {
    console.log(`Building demo space: ${config.name}`);
    console.log(`Output path: ${outputPath}`);
    
    try {
      // Generate a space ID
      const spaceId = randomUUID();
      
      // Create the directory structure
      await this.createSpaceDirectory(outputPath, spaceId, config);

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

  async createSpaceDirectory(outputPath, spaceId, config) {
    // Create the main directory
    await mkdir(outputPath, { recursive: true });

    // Create supa.md file
    const supaMdContent = `# Supa Space

This directory contains a Supa space. Please do not rename or modify the 'space-v1' folder as you won't be able to open the space from Supa. Supa needs it as is.`;
    
    await writeFile(join(outputPath, 'supa.md'), supaMdContent);

    // Create space-v1 directory
    const spaceV1Path = join(outputPath, 'space-v1');
    await mkdir(spaceV1Path, { recursive: true });

    // Create space.json
    const spaceJson = {
      id: spaceId,
      name: config.name,
      createdAt: config.createdAt
    };
    
    await writeFile(join(spaceV1Path, 'space.json'), JSON.stringify(spaceJson, null, 2));

    // Create ops directory structure
    const opsPath = join(spaceV1Path, 'ops');
    await mkdir(opsPath, { recursive: true });

    // Create a basic ops file structure
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    
    const datePath = join(opsPath, String(year), month, day);
    await mkdir(datePath, { recursive: true });

    // Create a basic ops file (this is simplified - in reality it would contain the actual operations)
    const opsContent = `["m",1,"${spaceId}",null]
["p",2,"${spaceId}","name","${config.name}"]
["p",3,"${spaceId}","_c","${config.createdAt}"]`;
    
    await writeFile(join(datePath, `${spaceId}.jsonl`), opsContent);

    console.log(`📁 Created space directory structure at: ${outputPath}`);
  }
} 