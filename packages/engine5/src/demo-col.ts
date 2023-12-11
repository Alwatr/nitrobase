import {createLogger} from '@alwatr/logger';

import {AlwatrStore} from './alwatr-store';
import {Region, StoreFileTTL} from './lib/type';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  saveDebounce: 5_000, // for demo
});

interface Post {
  [P: string]: string;
  title: string;
  body: string;
}

async function quickstart() {
  const colId = 'posts';

  logger.logProperty?.('colId', colId);

  // Check the collection exist?
  logger.logProperty?.('exists', alwatrStore.exists(colId));

  // Create a new collection.
  alwatrStore.defineCol({
    id: colId,
    region: Region.Public,
    ttl: StoreFileTTL.veryShort, // for demo
  });

  // Check the collection stat.
  logger.logProperty?.('stat', alwatrStore.stat(colId));

  // Get a collection reference.
  const myPostCol = await alwatrStore.col<Post>(colId);

  // create new item in the collection.
  myPostCol.create('post1', {
    title: 'new title',
    body: '',
  });

  // Read the collection item meta information.
  logger.logProperty?.('doc.meta', myPostCol.meta('post1'));

  // Set new data into the collection item.
  myPostCol.set('post1', {
    title: 'Welcome to Alwatr Storage',
    body: 'This is a amazing content',
  });

  // Read the collection item.
  logger.logProperty?.('context', myPostCol.get('post1'));

  // Update an existing collection item.
  myPostCol.update('post1', {
    body: 'My first AlwatrStore app',
  });
  logger.logProperty?.('context', myPostCol.get('post1'));

  logger.logProperty?.('doc.meta', myPostCol.meta('post1'));

  // Unload the collection from memory.
  alwatrStore.unload(colId);
  logger.logOther?.('The collection unloaded from ram');

  // Delete the collection store file.
  alwatrStore.deleteFile(colId);
  logger.logOther?.('The collection store file deleted');
}

quickstart();
