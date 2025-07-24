import { setupDialogsInPreloader } from './dialogs/electronDialog.js';
import { setupFSInPreloader} from './electronFs.js';

// So our app can use the file system
setupFSInPreloader();

// So our app can use the native dialogs
setupDialogsInPreloader();