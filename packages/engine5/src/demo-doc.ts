import {createLogger} from '@alwatr/logger';

import {AlwatrStore} from './alwatr-store.js';
import {Region, StoreFileTTL} from './type.js';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new store instance
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
  const docId = 'posts/intro-to-alwatr-store';

  logger.logProperty?.('docId', docId);

  // Check the document exist?
  const exists = alwatrStore.exists(docId);
  logger.logProperty?.('exists', exists);

  if (!exists) {
    // Define a new document store file.
    await alwatrStore.defineDocument(
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
  }

  // Check the document stat.
  logger.logProperty?.('stat', alwatrStore.stat(docId));

  // Create new document reference of specific id.
  const myPost = await alwatrStore.doc<Post>(docId);

  // Read the document meta information.
  logger.logProperty?.('doc.meta', myPost.meta());

  // Enter new data into the document.
  myPost.set({
    title: 'Welcome to Alwatr Store',
    body: 'This is a amazing content',
  });

  // Read the document.
  logger.logProperty?.('context', myPost.get());

  // Update an existing document.
  myPost.update({
    body: 'My first AlwatrStore Document',
  });
  logger.logProperty?.('context', myPost.get());

  logger.logProperty?.('doc.meta', myPost.meta());

  await new Promise((resolve) => setTimeout(resolve, 1_000));

  // Unload the document from memory.
  alwatrStore.unload(docId);
  logger.logOther?.('The document unloaded from ram');

  // Delete the document store file.
  // alwatrStore.deleteFile(docId);
  logger.logOther?.('The document store file deleted');
}

quickstart();
