import { protocol } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { spaceManager } from './spaceManager.js';

/**
 * Setup the custom 'sila' protocol for serving files from CAS
 * URL format: sila://spaces/{spaceId}/files/{hash}?type={mimeType}
 */
export function setupFileProtocol() {
  console.log('Setting up sila file protocol...');
  
  // Check if protocol is already registered
  if (protocol.isProtocolRegistered('sila')) {
    console.log('Sila protocol already registered');
    return;
  }
  
  protocol.handle('sila', async (request) => {
    console.log('File protocol request:', request.url);
    try {
      const url = new URL(request.url);
      console.log('Parsed URL:', {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams.entries())
      });
      
      // sila://spaces/{spaceId}/files/{hash}?type={mimeType}
      // The hostname is 'spaces', so we need to check that
      if (url.hostname !== 'spaces') {
        console.error('Invalid hostname:', url.hostname);
        return new Response('Invalid URL format - expected hostname "spaces"', { status: 400 });
      }
      
      const pathParts = url.pathname.split('/').filter(Boolean);
      console.log('Path parts:', pathParts);
      
      if (pathParts.length !== 3 || pathParts[1] !== 'files') {
        console.error('Invalid URL format:', request.url);
        console.error('Path parts validation failed:', {
          length: pathParts.length,
          secondPart: pathParts[1]
        });
        return new Response('Invalid URL format - expected path "/{spaceId}/files/{hash}"', { status: 400 });
      }
      
      const spaceId = pathParts[0];
      const hash = pathParts[2];
      const mimeType = url.searchParams.get('type');
      
      // Validate hash format (64 character hex string)
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        console.error('Invalid hash format:', hash);
        return new Response('Invalid hash format', { status: 400 });
      }
      
      // Get space root path
      const spaceRoot = spaceManager.getSpaceRootPath(spaceId);
      const allSpaces = spaceManager.getAllSpaces();
      console.log('Space lookup:', { 
        spaceId, 
        spaceRoot, 
        allSpaces: allSpaces.map(s => ({ id: s.spaceId, path: s.rootPath }))
      });
      if (!spaceRoot) {
        console.error('Space not found:', spaceId);
        console.error('Available spaces:', allSpaces.map(s => s.spaceId));
        return new Response('Space not found', { status: 404 });
      }
      
      const filePath = makeBytesPath(spaceRoot, hash);
      console.log('File path:', filePath);
      console.log('Space root:', spaceRoot);
      console.log('Hash:', hash);
      
      // Check if file exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      console.log('File exists:', fileExists);
      if (!fileExists) {
        console.error('File not found:', filePath);
        return new Response('File not found', { status: 404 });
      }
      
      // Read the file and return it as a response
      const fileBuffer = await fs.readFile(filePath);
      const headers = mimeType ? { 'Content-Type': mimeType } : undefined;
      
      return new Response(fileBuffer, { headers });
    } catch (error) {
      console.error('File protocol error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  });
  
  console.log('Sila file protocol registered successfully');
}

/**
 * Construct the file path for a given hash in CAS
 * @param {string} spaceRoot - Root path of the space
 * @param {string} hash - SHA256 hash of the file
 * @returns {string} Full path to the file
 */
function makeBytesPath(spaceRoot, hash) {
  const prefix = hash.slice(0, 2);
  const rest = hash.slice(2);
  return path.join(spaceRoot, 'space-v1', 'files', 'sha256', prefix, rest);
}


