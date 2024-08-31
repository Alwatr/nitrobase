import {flatString} from '@alwatr/flat-string';
import {StoreFileExtension, type StoreFileId, type StoreFileStat} from '@alwatr/store-types';

/**
 * Convert StoreFileId to a string ID.
 *
 * @param storeId - The StoreFileId.
 * @returns The store ID as a string.
 */
export function getStoreId(storeId: StoreFileId): string {
  let id = storeId.region + '/' + storeId.name;
  if (storeId.ownerId !== undefined) {
    id += '/' + storeId.ownerId;
  }
  return flatString(id);
}

/**
 * Returns the store path based on the provided storeStat object.
 *
 * @param storeStat The store file stat object.
 * @returns The store path.
 */
export function getStorePath(storeStat: StoreFileStat): string {
  let path: string = storeStat.region;
  if (storeStat.ownerId !== undefined) {
    path += '/' + storeStat.ownerId.slice(0, 3) + '/' + storeStat.ownerId;
  }
  path += `/${storeStat.name}.${storeStat.type}.${storeStat.extension ?? StoreFileExtension.Json}`;
  return flatString(path);
}
