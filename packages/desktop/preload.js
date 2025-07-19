import { contextBridge } from 'electron';
import { electronFs } from './electronFs.js';

// Expose the file system API to the renderer process
contextBridge.exposeInMainWorld('electronFs', {
  readDir: (path) => electronFs.readDir(path),
  exists: (path) => electronFs.exists(path),
  readTextFile: (path) => electronFs.readTextFile(path),
  readTextFileLines: (path) => electronFs.readTextFileLines(path),
  writeTextFile: (path, content) => electronFs.writeTextFile(path, content),
  create: (path) => electronFs.create(path),
  open: (path, options) => electronFs.open(path, options),
  mkdir: (path, options) => electronFs.mkdir(path, options),
  watch: (path, callback, options) => electronFs.watch(path, callback, options)
});