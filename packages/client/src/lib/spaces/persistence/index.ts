export { IndexedDBPersistenceLayer } from './IndexedDBPersistenceLayer';
export { FileSystemPersistenceLayer } from './FileSystemPersistenceLayer';
export { 
  createPersistenceLayersForURI, 
  isFileSystemURI, 
  requiresDualPersistence, 
  getFileSystemPath,
  setPeerIdOnLayers
} from './persistenceUtils'; 