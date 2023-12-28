import {createLogger} from '@alwatr/logger';
import {AlwatrStore, StoreFileExtension, StoreFileType, Region} from '@alwatr/store-engine';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  saveDebounce: 50, // for demo
});

const colId = {
  name: 'junk',
  region: Region.Public,
};

if (alwatrStore.exists(colId)) {
  await alwatrStore.deleteFile(colId);
}

alwatrStore.defineStoreFile({
  ...colId,
  extension: StoreFileExtension.Json,
  type: StoreFileType.Collection,
});

const col = await alwatrStore.collection(colId);

console.time('set all items');

const max = 1000;
for (let i = 0; i < max; i++) {
  col.append({
    fname: Math.random() + '',
    lname: Math.random() + '',
    email: Math.random() + '',
    token: Math.random() + '',
  });
}

console.timeEnd('set all items');

console.time('get item');
const item = col.get(500);
console.timeEnd('get item');
console.dir(item);
