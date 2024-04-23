console.log("=== TEST FS ===");

// Here we test FS read and write operations in Documents of MacOS.

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("HOME environment variable is not set");
}

const documentsPath = homeDir + "/Documents";

console.log("Static path: ", documentsPath);

try {
  const stat = await Deno.stat(documentsPath);
  console.log("Stat: ", stat);
} catch (e) {
  console.error(e);
}


console.log("Read contents: ", documentsPath);

try {
// First list directories in Documents using Deno.fs
const directories = [];
for await (const dirEntry of Deno.readDir(documentsPath)) {
  directories.push(dirEntry.name);
  console.log(dirEntry.name);
}
} catch (e) {
  console.error(e);
}

console.log("Create a dir: ", documentsPath);
// Create a new directory in Documents called "test-fs"
const testFsPath = documentsPath + "/test-fs";
await Deno.mkdir(testFsPath, { recursive: true });

console.log("Write: ", testFsPath);
// Write a file in the new directory
const testFsFilePath = testFsPath + "/test-fs.txt";
await Deno.writeTextFile(testFsFilePath, "Hello, world!");