#!/usr/bin/env node

import { readFileSync } from 'fs';
import { SimpleDemoBuilder } from './simple-builder';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: build-demo-space <json-file> [--output <path>]');
    process.exit(1);
  }

  const jsonFile = args[0];
  let outputPath = './demo-space';

  // Parse --output argument
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && outputIndex + 1 < args.length) {
    outputPath = args[outputIndex + 1];
  }

  try {
    // Read and parse JSON file
    const jsonContent = readFileSync(jsonFile, 'utf8');
    const config = JSON.parse(jsonContent);

    // Validate basic structure
    if (config.type !== 'supa-space' || config.version !== '1') {
      throw new Error('Invalid demo space configuration: type must be "supa-space" and version must be "1"');
    }

    // Build the demo space
    const builder = new SimpleDemoBuilder();
    const spaceId = await builder.buildFromConfig(config, outputPath);

    console.log(`✅ Demo space created successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`🆔 Space ID: ${spaceId}`);
    console.log(`\n💡 You can now open this space in Supa!`);

  } catch (error) {
    console.error('❌ Error building demo space:', error);
    process.exit(1);
  }
}

main().catch(console.error); 