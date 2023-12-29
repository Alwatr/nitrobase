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

  logger.time('===_DURATION_===');

  const max = 10_000;
  for (let i = 0; i < max; i++) {
    col.append({
      fname: Math.random().toString(36),
      lname: Math.random().toString(36),
      email: Math.random().toString(36),
      token: Math.random().toString(36),
    });
    await waitForImmediate();
  }

  logger.timeEnd('===_DURATION_===');

  await waitForTimeout(1000);

  logger.time('getItemTime');
  const item = col.get(500);
  logger.timeEnd('getItemTime');

  logger.logProperty('item', item);

})();
