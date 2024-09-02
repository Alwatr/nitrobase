import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region} from '@alwatr/store';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  defaultChangeDebounce: 2_000, // for demo
});

async function quickstart() {
  /**
   * @type {import('@alwatr/store').StoreFileId}
   */
  const postsCollectionId = {
    name: 'post',
    region: Region.PerUser,
    ownerId: 'user_123',
    schemaVer: 2,
  };

  logger.logProperty?.('collectionId', postsCollectionId);

  // Check the collection exist?
  const exists = alwatrStore.hasStore(postsCollectionId);
  logger.logProperty?.('exists', exists);

  if (exists) {
    // Delete the collection store file.
    alwatrStore.removeStore(postsCollectionId);
    logger.logOther?.('The collection store file deleted');
  }

  // Create a new collection.
  alwatrStore.newCollection(postsCollectionId);

  // Get a collection reference.
  const postsCollection = await alwatrStore.openCollection(postsCollectionId);

  logger.logProperty?.('collection.schemaVer', postsCollection.schemaVer);

  const post1Id = 'intro-to-alwatr-store';
  const post2Id = 'intro-to-alwatr-collections';

  // Create new new post (new item in the collection).
  postsCollection.addItem(post1Id, {
    title: 'Welcome to Alwatr Store',
    body: 'This is a amazing content',
  });

  // Read the collection item meta information.
  logger.logProperty?.('collection.meta', postsCollection.getItemMeta(post1Id));

  // Read the collection item.
  logger.logProperty?.('context1', postsCollection.getItemData(post1Id));

  // Update an existing collection item.
  postsCollection.mergeItemData(post1Id, {
    body: 'My first AlwatrStore Collection',
  });
  logger.logProperty?.('context', postsCollection.getItemData(post1Id));

  // post 2

  postsCollection.addItem(post2Id, {
    title: 'Welcome to Alwatr Collections',
    body: 'This is a amazing content',
  });
  logger.logProperty?.('context2', postsCollection.getItemData(post1Id));

  logger.logProperty?.('collection.meta1', postsCollection.getItemMeta(post1Id));
  logger.logProperty?.('collection.meta2', postsCollection.getItemMeta(post2Id));

  // Unload the collection from memory.
  alwatrStore.unloadStore(postsCollectionId);
  logger.logOther?.('The collection unloaded from ram');

  // Delete the collection store file.
  // alwatrStore.deleteFile(postsCollectionId);
  logger.logOther?.('The collection store file deleted');
}

quickstart();
