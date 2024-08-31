import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region, StoreFileExtension, StoreFileType} from '@alwatr/store-engine';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  defaultChangeDebounce: 2_000, // for demo
});

async function quickstart() {
  const postsCollectionId = {
    name: 'post',
    region: Region.PerUser,
    ownerId: 'user_123',
  };

  logger.logProperty?.('collectionId', postsCollectionId);

  // Check the collection exist?
  const exists = alwatrStore.exists(postsCollectionId);
  logger.logProperty?.('exists', exists);

  if (exists) {
    // Delete the collection store file.
    alwatrStore.deleteFile(postsCollectionId);
    logger.logOther?.('The collection store file deleted');
  }

  // Create a new collection.
  alwatrStore.defineStoreFile({
    ...postsCollectionId,
    type: StoreFileType.Collection,
  });

  // Get a collection reference.
  const postsCollection = await alwatrStore.collection(postsCollectionId);

  const post1Id = 'intro-to-alwatr-store';
  const post2Id = 'intro-to-alwatr-collections';

  // Create new new post (new item in the collection).
  postsCollection.create(post1Id, {
    title: 'Welcome to Alwatr Store',
    body: 'This is a amazing content',
  });

  // Read the collection item meta information.
  logger.logProperty?.('collection.meta', postsCollection.metaItem(post1Id));

  // Read the collection item.
  logger.logProperty?.('context1', postsCollection.get(post1Id));

  // Update an existing collection item.
  postsCollection.update(post1Id, {
    body: 'My first AlwatrStore Collection',
  });
  logger.logProperty?.('context', postsCollection.get(post1Id));

  // post 2

  postsCollection.create(post2Id, {
    title: 'Welcome to Alwatr Collections',
    body: 'This is a amazing content',
  });
  logger.logProperty?.('context2', postsCollection.get(post1Id));

  logger.logProperty?.('collection.meta1', postsCollection.metaItem(post1Id));
  logger.logProperty?.('collection.meta2', postsCollection.metaItem(post2Id));

  // Unload the collection from memory.
  alwatrStore.unload(postsCollectionId);
  logger.logOther?.('The collection unloaded from ram');

  // Delete the collection store file.
  // alwatrStore.deleteFile(postsCollectionId);
  logger.logOther?.('The collection store file deleted');
}

quickstart();
