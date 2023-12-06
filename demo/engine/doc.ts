import { AlwatrStoreDocument } from 'fs/promises';

import { createLogger } from '@alwatr/logger';
import {AlwatrStore} from '@alwatr/store-engine';
const logger = createLogger('AlwatrStoreDemo', true);
logger.banner('AlwatrStoreDemo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  pathPrefix: 'db',
  saveDebounce: 100,
});

interface DocumentDataType {
  title: string;
  body: string;
}

async function quickstart() {
  // Obtain a document reference.

  const documentPath = {
    id: 'posts/intro-to-alwatr-store',
    region: 'public',
  };

  logger.logProperty?.('documentPath', documentPath);

  logger.logProperty?.('stat(docPath)', alwatrStore.stat(documentPath));

  const documentRef = alwatrStore.document<DocumentDataType>(documentPath);

  logger.logProperty?.('doc.stat', documentRef.stat());

  // Enter new data into the document.
  let documentContext = documentRef.set({
    title: 'Welcome to Alwatr Storage',
    body: 'Hello World',
  });
  logger.logOther?.('Entered new data into the document', documentContext);

  // Update an existing document.
  documentContext = documentRef.update({
    body: 'My first AlwatrStore app',
  });
  logger.logOther?.('Updated an existing document', documentContext);

  // Read the document.
  documentContext = documentRef.get();
  logger.logOther?.('Read the document', documentContext);

  // Delete the document.
  documentRef.deleteFile();
  logger.logOther?.('Deleted the document');

  // Delete the document.
  alwatrStore.unloadDocument(documentRef.documentPath);
  logger.logOther?.('Unload the document from ram');
}
quickstart();
