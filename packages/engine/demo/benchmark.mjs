import {createLogger} from '@alwatr/logger';
import {AlwatrStore, StoreFileExtension, StoreFileType, Region} from '@alwatr/store-engine';
import {waitForIdle, waitForImmediate, waitForTimeout} from '@alwatr/wait';

(async function () {
  const logger = createLogger('AlwatrStore/Demo', true);
  logger.banner('AlwatrStore/Demo');

  // Create a new storage instance
  const alwatrStore = new AlwatrStore({
    rootPath: './db',
    defaultChangeDebounce: 1000, // for test
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
    type: StoreFileType.Collection,
    extension: StoreFileExtension.Json,
  });

  const col = await alwatrStore.collection(colId);

  await waitForTimeout(1000);

  logger.time('write_10k_record_time');

  const max = 10_000;
  for (let i = 0; i < max; i++) {
    col.append({
      fname: Math.random().toString(36),
      lname: Math.random().toString(36),
    });
    // await waitForImmediate();
  }

  logger.timeEnd('write_10k_record_time');

  await waitForTimeout(1000);

  logger.time('access_10k_item_time');
  let item;
  for (let i = 0; i < max; i++) {
    item = col.access_(i);
  }
  logger.timeEnd('access_10k_item_time');
  logger.logProperty('item', item);
})();
