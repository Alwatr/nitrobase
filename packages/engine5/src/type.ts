export interface AlwatrStoreConfig {
  /**
   * The root path of the storage.
   * This is where the AlwatrStore will store its data.
   */
  rootPath: string;

  /**
   * The save debounce timeout in milliseconds for minimal disk I/O usage.
   * This is used to limit the frequency of disk writes for performance reasons.
   * The recommended value is `50`.
   */
  saveDebounce: number;
}

/**
 * The subdirectory location for each store file.
 */
export enum Region {
  /**
   * Store file location that can be accessed by anyone.
   */
  Public = 'p',

  /**
   * Store file location that can be accessed by authenticated users.
   */
  Authenticated = 'a',

  /**
   * Store file location specific to each user id. Can be accessed using the user token.
   */
  PerUser = 'u',

  /**
   * Store file location specific to each device id.
   */
  PerDevice = 'd',

  /**
   * Store file location specific to each token.
   */
  PerToken = 't',

  /**
   * Private store file location. Cannot be accessed publicly and must be directly accessed by the admin API only.
   */
  Secret = 's',
}

/**
 * The different types of store file formats.
 */
export enum StoreFileType {
  /**
   * Type used for `single document` storage.
   */
  document = 'doc',

  /**
   * Type used for storing a `collection` of simpler documents, referred to as collection items.
   */
  collection = 'col',

  /**
   * Type used for storing a collection of items that are `append-only`.
   */
  appendOnlyCollection = 'aoc',
}

/**
 * Store file encoding types.
 */
export enum StoreFileEncoding {
  /**
   * Alwatr JSON store format.
   */
  json = 'ajs',
}

/**
 * Store file time to live in memory.
 */
export enum StoreFileTTL {
  /**
   * Store file will be removed from memory after 20 second of inactivity.
   */
  veryShort = 20_000,

  /**
   * Store file will be removed from memory after 5 minutes of inactivity.
   */
  short = 300_000,

  /**
   * Store file will be removed from memory after 30 minutes of inactivity.
   */
  medium = 1_800_000,

  /**
   * Store file will be removed from memory after 4 hour of inactivity.
   */
  long = 14_400_000,

  /**
   * Store file will be removed from memory after 24 hour of inactivity.
   */
  veryLong = 43_200_000,

  /**
   * Store file will not removed from memory until memory limit.
   */
  maximum = -1,
}

/**
 * Represents the detailed statistics of a store file.
 */
export interface StoreFileStat {
  /**
   * The unique identifier of the store file.
   */
  id: string;

  /**
   * The type of the store file.
   *
   * @see {@link StoreFileType}
   */
  type: StoreFileType;

  /**
   * The region where the store file is located.
   *
   * @see {@link Region}
   */
  region: Region;

  /**
   * The encoding used for the store file.
   *
   * @see {@link StoreFileEncoding}
   */
  encoding: StoreFileEncoding;

  /**
   * The time-to-live (TTL) of the store file in memory.
   *
   * @see {@link StoreFileTTL}
   */
  ttl: StoreFileTTL;
}

/**
 * Represents the metadata of a store file.
 */
export interface StoreFileMeta {
  /**
   * The unique identifier of the store file.
   */
  id: string;

  /**
   * The type of the store file.
   * @see {@link StoreFileType}
   */
  type: StoreFileType;

  /**
   * The region where the store file is located.
   * @see {@link Region}
   */
  region: Region;

  /**
   * The AlwatrStore engine version.
   */
  ver: string;

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
   * The Unix timestamp (in milliseconds since the epoch) for when the store file was updated.
   */
  updated: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the store file was created.
   */
  created: number;
}

/**
 * Represents the context of a store file.
 * @template TData The type of the data content in the store file.
 */
export interface StoreFileContext<TData extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * The status of the store file.
   *
   * if false, the Alwatr store throws an error.
   */
  ok: true;

  /**
   * The metadata of the store file.
   * @see {@link StoreFileMeta}
   */
  meta: StoreFileMeta;

  /**
   * The data content of the store file.
   */
  data: TData;
}

/**
 * Store file meta only content type.
 */
export type StoreFileMetaOnlyContext = Omit<StoreFileContext<never>, 'data'>;

/**
 * Document store item context type.
 */
export type DocumentContext<TDoc extends Record<string, unknown> = Record<string, unknown>> = StoreFileContext<TDoc>;


// collections

/**
 * The metadata of an item in a collection.
 */
export interface CollectionItemMeta {
  /**
   * The unique identifier for the collection item.
   */
  id: string;

  /**
   * The revision number for the collection item.
   *
   * This number is incremented each time the item is updated.
   */
  rev: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the collection item was updated.
   */
  updated: number;

  /**
   * The Unix timestamp (in milliseconds since the epoch) for when the collection item was created.
   */
  created: number;
}

/**
 * Collection item context type.
 */
export interface CollectionItem<TItem> {
/**
   * Collection item's metadata.
   */
  meta: CollectionItemMeta;

  /**
   * Collection item data.
   */
  data: TItem;
}

/**
 * Collection item context type.
 */
export type CollectionContext<TItem extends Record<string, unknown> = Record<string, unknown>> = StoreFileContext<
  Record<string, CollectionItem<TItem>>
>;
