import {flatString, packageTracer} from '@alwatr/nanolib';
import {StoreFileExtension, type StoreFileId, type StoreFileStat} from '@alwatr/nitrobase-types';

__dev_mode__: packageTracer.add(__package_name__, __package_version__);

/**
 * Convert StoreFileId to a string ID.
 *
 * @param storeId - The StoreFileId.
 * @returns The nitrobase ID as a string.
 */
export function getStoreId(storeId: StoreFileId): string {
  let id = storeId.region + '/' + storeId.name;
  if (storeId.ownerId !== undefined) {
    id += '/' + storeId.ownerId;
  }
  return flatString(id);
}

/**
 * Returns the nitrobase path based on the provided storeStat object.
 *
 * @param storeStat The nitrobase file stat object.
 * @returns The nitrobase path.
 */
export function getStorePath(storeStat: StoreFileStat): string {
  let path: string = storeStat.region;
  if (storeStat.ownerId !== undefined) {
    path += '/' + storeStat.ownerId.slice(0, 3) + '/' + storeStat.ownerId;
  }
  path += `/${storeStat.name}.${storeStat.type}.${storeStat.extension ?? StoreFileExtension.Json}`;
  return flatString(path);
}
