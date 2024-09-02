import {definePackage} from '@alwatr/dedupe';

import type {} from '@alwatr/nano-build';
import type {Dictionary, JsonifiableObject} from '@alwatr/type-helper';

definePackage('@alwatr/store-types', __package_version__);

// *** Store File ***

/**
 * The subdirectory location for each store file.
 */
export enum Region {
  /**
   * Store file location that can be accessed by anyone. e.g. Product list.
   */
  Public = 'p',

  /**
   * Store file location that can be accessed by authenticated users. e.g. Special price list for dealers
   */
  Authenticated = 'a',

  /**
   * Store file location that can be accessed by admins and managers only. e.g. User list.
   */
  Managers = 'm',

  /**
   * Store file location specific to each user id. Can be accessed using the user token. e.g. User profile and User orders.
   */
  PerUser = 'u',

  /**
   * Store file location specific to each owner id. e.g. user token or device id.
   */
  PerOwner = 'o',

  /**
   * Private store file location. Cannot be accessed publicly and must be directly accessed by the admin API only. e.g. User secret data.
   */
  Secret = '.s',
}

/**
 * The different types of store file formats.
 */
export enum StoreFileType {
  /**
   * Type used for `single document` storage.
   */
  Document = 'doc',

  /**
   * Type used for storing a `collection` of simpler documents, referred to as collection items.
   */
  Collection = 'col',

  /**
   * Type used for storing a collection of items that are `append-only`.
   */
  AppendOnlyCollection = 'aoc',
}

/**
 * Store file extension (encode).
 */
export enum StoreFileExtension {
  /**
   * AlwatrStore JSON format.
   */
  Json = 'asj',
}

/**
 * Unique identifier of the store file.
 *
 * Get from user for select store file.
 */
export type StoreFileId = {
  /**
   * The store filename.
   */
  readonly name: string;

  /**
   * The region where the store file is located.
   * @see {@link Region}
   */
  readonly region: Region;

  /**
   * The owner of the store file.
   * If the region is `Region.PerX` then this is the user id, device id, or token id etc.
   * @see {@link Region}
   *
   */
  readonly ownerId?: string;

  /**
   * The schema version for easy migration by user.
   * If not specified, the default value is `1`.
   */
  schemaVer?: number;
};

/**
 * Store the complete metadata of the file in the root database.
 */
export type StoreFileStat = StoreFileId & {
  /**
   * The type of the store file.
   *
   * @see {@link StoreFileType}
   */
  readonly type: StoreFileType;

  /**
   * The extension used for the store file.
   *
   * @see {@link StoreFileExtension}
   */
  readonly extension?: StoreFileExtension;

  /**
   * The save debounce timeout in milliseconds for minimal disk I/O usage.
   * This is used to limit the frequency of disk writes for performance reasons.
   * The recommended value is `40`.
   * If not specified, the default value get from AlwatrStore `defaultChangeDebounce`.
   */
  readonly changeDebounce?: number;

  /**
   * The time-to-live (TTL) of the store file in memory.
   */
  // readonly ttl?: number;
};

/**
 * Represents the metadata of a store file.
 */
export type StoreFileMeta = StoreFileStat & {
  /**
   * Store file format version.
   */
  fv: number;

  /**
   * The revision number of the store file.
   *
   * This number is incremented every time the store file is updated.
   */
  rev: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the store file was created.
   */
  readonly created: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the store file was updated.
   */
  updated: number;

  /**
   * Last auto increment id.
   */
  lastAutoId?: number;

  /**
   * The extra metadata for the store file.
   */
  extra: Dictionary;
};

export type StoreFileData<T extends JsonifiableObject = JsonifiableObject> = T;

/**
 * Represents the context of a store file.
 * @template TData The type of the data content in the store file.
 */
export type StoreFileContext<TData extends JsonifiableObject = JsonifiableObject> = {
  /**
   * The status of the store file.
   *
   * if false, the Alwatr store throws an error.
   */
  readonly ok: true;

  /**
   * The metadata of the store file.
   * @see {@link StoreFileMeta}
   */
  readonly meta: StoreFileMeta;

  /**
   * The data content of the store file.
   */
  readonly data: TData;
};

/**
 * Store file meta only content type.
 */
export type StoreFileMetaOnlyContext = Omit<StoreFileContext<never>, 'data'>;

// *** Documents ***

/**
 * StoreFileContext for document type.
 */
export type DocumentContext<T extends JsonifiableObject = JsonifiableObject> = StoreFileContext<T>;

// *** Collections ***

/**
 * The metadata of an item in a collection.
 */
export type CollectionItemMeta = {
  /**
   * The unique identifier for the collection item.
   */
  readonly id: string | number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the collection item was created.
   */
  readonly created: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the collection item was updated.
   */
  updated: number;

  /**
   * The revision number for the collection item.
   *
   * This number is incremented each time the item is updated.
   */
  rev: number;
};

/**
 * Collection item context type.
 */
export type CollectionItem<TData extends JsonifiableObject = JsonifiableObject> = {
  /**
   * Collection item's metadata.
   */
  readonly meta: CollectionItemMeta;

  /**
   * Collection item data.
   */
  readonly data: TData;
};

/**
 * Collection item context type.
 */
export type CollectionContext<T extends JsonifiableObject = JsonifiableObject> = StoreFileContext<Dictionary<CollectionItem<T>>>;
