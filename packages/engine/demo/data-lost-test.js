import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region, StoreFileExtension, StoreFileType} from '@alwatr/store-engine';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

const alwatrStore = new AlwatrStore({
  rootPath: './db'
});

const docId = {
  name: 'data-lost-test',
  region: Region.Public,
}

if (!alwatrStore.exists(docId)) {
  alwatrStore.defineStoreFile({
    ...docId,
    type: StoreFileType.Collection,
    extension: StoreFileExtension.Json,
  });
}

const collection = await alwatrStore.collection(docId);

function insertData () {
  const id = collection.append({
    name: (Math.random() * 10000).toString(36),
    age: Math.floor(Math.random() * 80) + 10,
  });

  console.log('Inserted', id);

  if (Math.random() < 0.01) {
    throw new Error('unexpected_random_error');
  }

  setTimeout(insertData, 5);
}

insertData();
