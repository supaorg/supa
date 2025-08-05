#!/usr/bin/env node

import { readFileSync } from 'fs';
import { SimpleDemoBuilder } from './simple-builder';

async function main() {
  const args = process.argv.slice(2);

  // Default values
  let jsonFile = 'packages/build-scripts/examples/getting-started.json';
  let outputPath = './demos/demo-space';

  // Parse arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--output' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i += 2; // Skip both --output and its value
    } else if (arg.startsWith('--output=')) {
      outputPath = arg.substring(9); // Remove '--output='
      i += 1;
    } else if (!arg.startsWith('--')) {
      // First non-flag argument is the JSON file
      jsonFile = arg;
      i += 1;
    } else {
      i += 1;
    }
  }

  console.log(`📄 Using config file: ${jsonFile}`);
  console.log(`📁 Output directory: ${outputPath}`);

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

    // Exit cleanly
    process.exit(0);

  } catch (error) {
    console.error('❌ Error building demo space:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 