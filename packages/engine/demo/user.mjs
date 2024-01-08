import {AlwatrStore, Region, StoreFileExtension, StoreFileType, WriteFileMode, writeFile, resolve} from '@alwatr/store-engine';

const storeEngine = new AlwatrStore({
  rootPath: './data',
  defaultChangeDebounce: 50,
});

export async function newUser(userId, userToken) {
  // 1. create user profile doc
  const collectionStat = {
    name: 'user-info',
    ownerId: userId,
    region: Region.PerUser,
    type: StoreFileType.Document,
    extension: StoreFileExtension.Json,
  };
  storeEngine.defineStoreFile(collectionStat, {});

  // create doc to return to user
  const doc = await storeEngine.doc(collectionStat);

  // 2. create token nothing file in per user region
  const tokenInfoFilePath = doc.path.replace('user-info.doc.asj', 'token/' + userToken + '.asn');
  console.log(tokenInfoFilePath);
  writeFile (resolve('data', tokenInfoFilePath), '', WriteFileMode.Replace, true);

  // 3. create per token doc
  storeEngine.defineStoreFile({
    name: 'token-info',
    ownerId: userToken,
    region: Region.PerToken,
    type: StoreFileType.Document,
    extension: StoreFileExtension.Json,
  }, {userId}); // also can save lpe in token

  return doc;
}

await newUser('userId123', 'userToken123');
await newUser('userId124', 'userToken223');
await newUser('userId125', 'userToken323');
