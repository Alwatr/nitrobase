import {createLogger} from '@alwatr/logger';

import {AlwatrStore, Region} from '@alwatr/store-engine';

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
    alwatrStore.remove(postsCollectionId);
    logger.logOther?.('The collection store file deleted');
  }

  // Create a new collection.
  alwatrStore.newCollection(postsCollectionId);

  // Get a collection reference.
  const postsCollection = await alwatrStore.openCollection(postsCollectionId);

  const post1Id = 'intro-to-alwatr-store';
  const post2Id = 'intro-to-alwatr-collections';

  // Create new new post (new item in the collection).
  postsCollection.add(post1Id, {
    title: 'Welcome to Alwatr Store',
    body: 'This is a amazing content',
  });

  // Read the collection item meta information.
  logger.logProperty?.('collection.meta', postsCollection.getItemMetadata(post1Id));

  // Read the collection item.
  logger.logProperty?.('context1', postsCollection.getItem(post1Id));

  // Update an existing collection item.
  postsCollection.update(post1Id, {
    body: 'My first AlwatrStore Collection',
  });
  logger.logProperty?.('context', postsCollection.getItem(post1Id));

  // post 2

  postsCollection.add(post2Id, {
    title: 'Welcome to Alwatr Collections',
    body: 'This is a amazing content',
  });
  logger.logProperty?.('context2', postsCollection.getItem(post1Id));

  logger.logProperty?.('collection.meta1', postsCollection.getItemMetadata(post1Id));
  logger.logProperty?.('collection.meta2', postsCollection.getItemMetadata(post2Id));

  // Unload the collection from memory.
  alwatrStore.unload(postsCollectionId);
  logger.logOther?.('The collection unloaded from ram');

  // Delete the collection store file.
  // alwatrStore.deleteFile(postsCollectionId);
  logger.logOther?.('The collection store file deleted');
}

quickstart();
