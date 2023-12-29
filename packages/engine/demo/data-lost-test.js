import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region, StoreFileExtension, StoreFileType} from '@alwatr/store-engine';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

const alwatrStore = new AlwatrStore({
  rootPath: './db',
  defaultChangeDebounce: 250, // for demo
});

const list = [];

for (let i = 0; i < 10; i++) {
  /**
   * @type
   */
  const docId = {
    name: 'profile',
    region: Region.PerUser,
    ownerId: `u${i}-hash-126789`,
  };

  if (!alwatrStore.exists(docId)) {
    alwatrStore.defineStoreFile({
      ...docId,
      type: StoreFileType.Collection,
      extension: StoreFileExtension.Json,
    });
  }

  list.push(await alwatrStore.collection(docId));
}

function insertData() {
  const collection = list[Math.floor(Math.random() * list.length)];

  let itemId = collection.append({
    name: (Math.random() * 10000).toString(36),
    age: Math.floor(Math.random() * 80) + 10,
  });


  console.log('Collection: %s, itemId:', collection.id, itemId);

  itemId = list[0].append({
    name: (Math.random() * 10000).toString(36),
    age: 15,
  })

  console.log('Collection0, itemId:', itemId);

  if (Math.random() < 0.001) {
    throw new Error('unexpected_random_error');
  }

  setTimeout(insertData, 2);
}

insertData();
