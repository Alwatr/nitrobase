import {createLogger} from '@alwatr/logger';

import {AlwatrStore} from './alwatr-store.js';
import {Region, StoreFileTTL} from './lib/type.js';

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
  // Obtain a document reference.

  const docId = 'posts/intro-to-alwatr-store';

  logger.logProperty?.('docId', docId);

  // Check document stat. return null if not exist.
  logger.logProperty?.('stat', alwatrStore.stat(docId));

  // Create a new document.
  alwatrStore.defineDoc(
    {
      id: docId,
      region: Region.Public,
      ttl: StoreFileTTL.veryShort, // for demo
    },
    {
      title: 'new title',
      body: '',
    },
  );

  // Create new document reference of specific id.
  const myPostDoc = await alwatrStore.doc<Post>(docId);

  // Read the document meta information.
  logger.logProperty?.('doc.meta', myPostDoc.meta());

  // Enter new data into the document.
  myPostDoc.set({
    title: 'Welcome to Alwatr Storage',
    body: 'This is a amazing content',
  });

  // Read the document.
  logger.logProperty?.('context', myPostDoc.get());

  // Update an existing document.
  myPostDoc.update({
    body: 'My first AlwatrStore app',
  });
  logger.logProperty?.('context', myPostDoc.get());

  logger.logProperty?.('doc.meta', myPostDoc.meta());

  // Unload the document from memory.
  alwatrStore.unload(docId);
  logger.logOther?.('The document unloaded from ram');

  // Delete the document store file.
  alwatrStore.deleteFile(docId);
  logger.logOther?.('The document store file deleted');
}

quickstart();
