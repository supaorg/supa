import { clientState } from "../state/clientState.svelte";

/**
 * Checks if a directory contains a space-v* directory
 */
async function containsSpaceVersionDir(dir: string): Promise<boolean> {
  try {
    const entries = await clientState.fs.readDir(dir);
    return entries.some(entry => entry.isDirectory && entry.name.startsWith('space-v'));
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the provided path is a valid space directory or contains one
 * @param path The path to check
 * @returns The root path of the space
 * @throws If no valid space directory is found
 */
export async function checkIfPathHasValidStructureAndReturnActualRootPath(path: string): Promise<string> {
  // Check if current directory contains a space-v* directory
  if (await containsSpaceVersionDir(path)) {
    return path;
  }
  
  // Check if we're inside a space-v* directory (one level deep)
  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart.startsWith('space-v')) {
    const parentPath = pathParts.slice(0, -1).join('/');
    if (await clientState.fs.exists(`${parentPath}/${lastPart}`)) {
      return parentPath;
    }
  }
  
  // Check one level up for a space-v* directory
  const parentPath = path + '/..';
  if (await containsSpaceVersionDir(parentPath)) {
    return parentPath;
  }
  
  throw new Error('Not a valid Supa space directory. Expected to find a space-v* directory.');
}

/**
 * Loads space metadata from a file system path
 * @param path The space directory path
 * @returns Object containing space ID and other metadata
 */
export async function loadSpaceMetadataFromPath(path: string): Promise<{ spaceId: string }> {
  // Validate and get the actual root path
  const rootPath = await checkIfPathHasValidStructureAndReturnActualRootPath(path);
  
  // Check if space.json exists and read space ID
  const spaceJsonPath = `${rootPath}/space-v1/space.json`;
  
  if (!await clientState.fs.exists(spaceJsonPath)) {
    throw new Error(`space.json not found in space-v1 structure at ${rootPath}`);
  }
  
  const spaceJson = await clientState.fs.readTextFile(spaceJsonPath);
  const spaceData = JSON.parse(spaceJson);
  const spaceId = spaceData.id;
  
  if (!spaceId) {
    throw new Error("Space ID not found in space.json");
  }
  
  return { spaceId };
}

/**
 * Checks if a path is a valid space directory (contains space-v* folder)
 * @param path The path to check
 * @returns True if the path contains a valid space structure
 */
export async function isValidSpaceDirectory(path: string): Promise<boolean> {
  try {
    await checkIfPathHasValidStructureAndReturnActualRootPath(path);
    return true;
  } catch {
    return false;
  }
} 