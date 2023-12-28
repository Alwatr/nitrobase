import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region, StoreFileExtension, StoreFileType} from '../src/alwatr-store.js';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new store instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  defaultChangeDebounce: 5_000, // for demo
});

async function quickstart() {
  const docId = {
    name: 'posts/intro-to-alwatr-store',
    region: Region.Authenticated,
  };

  logger.logProperty?.('docId', docId);

  // Check the document exist?
  const exists = alwatrStore.exists(docId);
  logger.logProperty?.('exists', exists);

  if (!exists) {
    // Define a new document store file.
    alwatrStore.defineStoreFile({
      ...docId,
      type: StoreFileType.Collection,
      extension: StoreFileExtension.Json,
    }, {
      title: 'new title',
      body: '',
    });
  }

  // Create new document reference of specific id.
  const myPost = await alwatrStore.doc(docId);

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
