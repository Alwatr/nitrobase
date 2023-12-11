export interface AlwatrStoreConfig {
  /**
   * The root path of the storage.
   */
  rootPath: string;

  /**
   * The save debounce timeout in milliseconds for minimal disk I/O usage. The recommended value is `50`.
   */
  saveDebounce: number;
}

/**
 * Store file region
 *
 * Subdirectory location for each store file.
 */
export enum Region {
  /**
   * Public store file location can access by anyone.
   */
  Public = 'p',

  /**
   * Public store file location can access by authenticated user.
   */
  Authenticated = 'a',

  /**
   * Public store file location for each user id and can access by the user token.
   */
  PerUser = 'u',

  /**
   * Public store file location for each device id.
   */
  PerDevice = 'd',

  /**
   * Public store file location for each token.
   */
  PerToken = 't',

  /**
   * Private store file location can not access by anyone publicly and must directly access by the admin api only.
   */
  Secret = 's',
}

/**
 * Store file format type.
 */
export enum StoreFileType {
  document = 'doc',
  collection = 'col',
  appendOnlyCollection = 'aoc',
}

/**
 * Store file encoding type.
 */
export enum StoreFileEncoding {
  /**
   * Alwatr json store format.
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
 * Store file stat detail.
 */
export interface StoreFileStat {
  /**
   * Store file ID.
   */
  id: string;

  /**
   * Store file type.
   */
  type: StoreFileType;

  /**
   * Store file file region.
   */
  region: Region;

  /**
   * Store file encoding.
   */
  encoding: StoreFileEncoding;

  /**
   * Store file time to live in memory.
   */
  ttl: StoreFileTTL;
}

/**
 * Store file meta data.
 */
export interface StoreFileMeta {
  /**
   * Store file ID.
   */
  id: string;

  /**
   * Store file type.
   */
  type: StoreFileType;

  /**
   * Store file file region.
   */
  region: Region;

  encoding: StoreFileEncoding;

  /**
   * Alwatr store engine major version number.
   */
  version: number;

  /**
   * Store file revision number.
   */
  rev: number;

  /**
   * Store file last updated timestamp.
   */
  updated: number;

  /**
   * Store file created timestamp.
   */
  created: number;
}

export interface StoreFileContext<TData extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Store file status.
   */
  ok: true;

  /**
   * Store file meta information.
   */
  meta: StoreFileMeta;

  /**
   * Store file data content.
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
 * Collection item meta information.
 */
export interface CollectionItemMeta {
  /**
   * Collection item id.
   */
  id: string;

  /**
   * Collection item revision number.
   */
  rev: number;

  /**
   * Collection item last updated timestamp.
   */
  updated: number;

  /**
   * Collection item created timestamp.
   */
  created: number;
}

/**
 * Collection item context type.
 */
export interface CollectionItem<TItem> {
  /**
   * Collection item meta information.
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
