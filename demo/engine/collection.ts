import {createLogger} from '@alwatr/logger';
import {AlwatrStore, type AlwatrDocumentRefrence} from '@alwatr/store-engine';

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

  const collectionPath = {
    id: 'post-list',
    region: 'public',
  };

  logger.logProperty?.('collectionPath', collectionPath);

  logger.logProperty?.('stat(collPath)', alwatrStore.stat(collectionPath));

  const collectionRef = alwatrStore.collection<DocumentDataType>(collectionPath);

  processDocument(collectionRef.document('post-1'));
  processDocument(collectionRef.document('post-2'));

  // Delete the document.
  alwatrStore.unloadCollection(collectionRef.collectionPath);
  logger.logOther('Unload the collection from ram');
}

function processDocument(documentRef: AlwatrDocumentRefrence<DocumentDataType>) {
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
}

quickstart();
