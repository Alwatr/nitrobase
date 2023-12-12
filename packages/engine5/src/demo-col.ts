import {createLogger} from '@alwatr/logger';

import {AlwatrStore} from './alwatr-store.js';
import {Region, StoreFileTTL} from './type.js';

const logger = createLogger('AlwatrStore/Demo', true);
logger.banner('AlwatrStore/Demo');

// Create a new storage instance
const alwatrStore = new AlwatrStore({
  rootPath: './db',
  saveDebounce: 5_000, // for demo
});

interface Post {
  [P: string]: string;
  title: string;
  body: string;
}

async function quickstart() {
  const postsCollectionId = 'post-list';

  logger.logProperty?.('collectionId', postsCollectionId);

  // Check the collection exist?
  logger.logProperty?.('exists', alwatrStore.exists(postsCollectionId));

  // Create a new collection.
  alwatrStore.defineCollection({
    id: postsCollectionId,
    region: Region.Public,
    ttl: StoreFileTTL.veryShort, // for demo
  });

  // Check the collection stat.
  logger.logProperty?.('stat', alwatrStore.stat(postsCollectionId));

  // Get a collection reference.
  const postsCollection = await alwatrStore.collection<Post>(postsCollectionId);

  const post1Id = 'intro-to-alwatr-store';
  const post2Id = 'intro-to-alwatr-collections';

  // Create new new post (new item in the collection).
  postsCollection.create(post1Id, {
    title: 'Welcome to Alwatr Store',
    body: 'This is a amazing content',
  });

  // Read the collection item meta information.
  logger.logProperty?.('collection.meta', postsCollection.meta(post1Id));

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

  logger.logProperty?.('collection.meta1', postsCollection.meta(post1Id));
  logger.logProperty?.('collection.meta2', postsCollection.meta(post2Id));

  // Unload the collection from memory.
  alwatrStore.unload(postsCollectionId);
  logger.logOther?.('The collection unloaded from ram');

  // Delete the collection store file.
  alwatrStore.deleteFile(postsCollectionId);
  logger.logOther?.('The collection store file deleted');
}

quickstart();
