import { protocol } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { spaceManager } from './spaceManager.js';

/**
 * Setup the custom 'sila' protocol for serving files from CAS
 * URL format: sila://spaces/{spaceId}/files/{hash}?type={mimeType}
 */
export function setupFileProtocol() {
  // Check if protocol is already registered
  if (protocol.isProtocolRegistered('sila')) {
    return;
  }
  
  protocol.handle('sila', async (request) => {
    try {
      const url = new URL(request.url);
      
      // sila://spaces/{spaceId}/files/{hash}?type={mimeType}
      if (url.hostname !== 'spaces') {
        return new Response('Invalid URL format - expected hostname "spaces"', { status: 400 });
      }
      
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length !== 3 || pathParts[1] !== 'files') {
        return new Response('Invalid URL format - expected path "/{spaceId}/files/{hash}"', { status: 400 });
      }
      
      const spaceId = pathParts[0];
      const hash = pathParts[2];
      const mimeType = url.searchParams.get('type');
      const downloadName = url.searchParams.get('name');
      
      // Validate hash format (64 character hex string)
      if (!/^[a-f0-9]{64}$/.test(hash)) {
        return new Response('Invalid hash format', { status: 400 });
      }
      
      // Get space root path
      const spaceRoot = spaceManager.getSpaceRootPath(spaceId);
      if (!spaceRoot) {
        return new Response('Space not found', { status: 404 });
      }
      
      const filePath = makeBytesPath(spaceRoot, hash);
      
      // Check if file exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return new Response('File not found', { status: 404 });
      }
      
      // Check for range requests (for streaming large files)
      const range = request.headers.get('range');
      if (range) {
        return await handleRangeRequest(filePath, range, mimeType, downloadName);
      }
      
      // For small files or non-range requests, read the entire file
      const fileBuffer = await fs.readFile(filePath);
      const headers = {};
      if (mimeType) headers['Content-Type'] = mimeType;
      if (downloadName) headers['Content-Disposition'] = `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`;
      
      return new Response(fileBuffer, { headers });
    } catch (error) {
      return new Response('Internal server error', { status: 500 });
    }
  });
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

/**
 * Handle range requests for streaming large files
 * @param {string} filePath - Path to the file
 * @param {string} rangeHeader - Range header value (e.g., "bytes=0-1023")
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Response>} Streaming response
 */
async function handleRangeRequest(filePath, rangeHeader, mimeType, downloadName) {
  try {
    // Parse range header: "bytes=0-1023"
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return new Response('Invalid range format', { status: 400 });
    }

    const start = parseInt(match[1]);
    const end = match[2] ? parseInt(match[2]) : null;

    // Get file stats
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;

    // Validate range
    if (start >= fileSize || (end && end >= fileSize) || start > end) {
      return new Response('Range not satisfiable', { 
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`
        }
      });
    }

    const actualEnd = end || fileSize - 1;
    const contentLength = actualEnd - start + 1;

    // For now, read the range into memory (we'll optimize this later)
    const buffer = await fs.readFile(filePath);
    const rangeBuffer = buffer.slice(start, actualEnd + 1);

    const headers = {
      'Content-Range': `bytes ${start}-${actualEnd}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString()
    };
    if (mimeType) headers['Content-Type'] = mimeType;
    if (downloadName) headers['Content-Disposition'] = `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`;

    return new Response(rangeBuffer, { 
      status: 206, // Partial Content
      headers 
    });

  } catch (error) {
    return new Response('Internal server error', { status: 500 });
  }
}


