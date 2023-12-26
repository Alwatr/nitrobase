import {CollectionReference, DocumentReference} from '@alwatr/store-reference';
import {
  StoreFileType,
  StoreFileExtension,
  Region,
  type StoreFileStat,
  type StoreFileContext,
  type CollectionContext,
  DocumentContext,
} from '@alwatr/store-types';

import {StoreFileStatModel} from './lib/store-file-stat.js'
import {WriteFileMode, existsSync, readJsonFile, resolve, unlink, writeJsonFile} from './lib/util.js';
import {logger} from './logger.js';

logger.logModule?.('alwatr-store');

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
 * AlwatrStore engine.
 *
 * It provides methods to read, write, validate, and manage store files.
 * It also provides methods to interact with `documents` and `collections` in the store.
 */
export class AlwatrStore {
  /**
   * The Alwatr Store version string.
   *
   * Use for store file format version for check compatibility.
   */
  static readonly version = __package_version;

  /**
   * The root store file stat.
   */
  protected static readonly rootDbStat_: StoreFileStat = {
    name: '.store',
    region: Region.Secret,
    type: StoreFileType.Collection,
    extension: StoreFileExtension.Json,
  };

  /**
   * Validates a store file with the provided context and try to migrate if needed.
   *
   * @param context The store file context.
   */
  protected static validateStoreFile_(context: StoreFileContext<Record<string, unknown>>): void {
    logger.logMethodArgs?.('validateStoreFile_', {id: context.meta});

    if (context.ok !== true) {
      logger.accident?.('validateStoreFile_', 'store_not_ok', context);
      throw new Error('store_not_ok', {cause: context});
    }

    if (context.meta?.ver !== AlwatrStore.version) {
      logger.accident?.('validateStoreFile_', 'store_version_incompatible', {
        fileVersion: context.meta.ver,
        currentVersion: AlwatrStore.version,
      });

      switch (context.meta?.type) {
        case StoreFileType.Document: {
          DocumentReference.migrateContext_(context);
          break;
        }

        case StoreFileType.Collection: {
          CollectionReference.migrateContext_(context);
          break;
        }

        default:
          logger.accident?.('validateStoreFile_', 'store_file_type_not_supported', context.meta);
          throw new Error('store_file_type_not_supported', {cause: context.meta});
      }
    }

    if (
      context.meta.region === Region.PerUser ||
      context.meta.region === Region.PerToken ||
      context.meta.region === Region.PerDevice
    ) {
      if (context.meta.ownerId === undefined) {
        logger.accident('validateStoreFile_', 'store_owner_id_not_defined', context.meta);
        throw new Error('store_owner_id_not_defined', {cause: context.meta});
      }
    }
  }

  /**
   * `collectionReference` of all `storeFileStat`s.
   * This is the root store collection.
   */
  protected rootDb_;

  /**
   * Constructs an AlwatrStore instance with the provided configuration.
   *
   * @param config_ The configuration of the AlwatrStore engine.
   * @example
   * ```typescript
   * const alwatrStore = new AlwatrStore({
   *   rootPath: './db',
   *   saveDebounce: 100,
   * });
   * ```
   */
  constructor(readonly config_: AlwatrStoreConfig) {
    logger.logMethodArgs?.('new', config_);
    this.rootDb_ = this.loadRootDb_();
  }

  /**
   * Checks if a store file with the given id exists.
   *
   * @param id store file id
   * @returns true if a store file with the given id exists, false otherwise
   * @example
   * ```typescript
   * if (!alwatrStore.exists('user1/profile')) {
   *   alwatrStore.defineDocument(...)
   * }
   * ```
   */
  exists(stat: StoreFileStatModel): boolean {
    const exists = this.rootDb_.exists(stat.id);
    logger.logMethodFull?.('exists', stat.id, exists);
    return exists;
  }

  /**
   * Returns the stats of a store file with the given id from the root store document without loading the store file.
   * If the store file does not exist, an error is thrown.
   *
   * @param id store file id
   * @returns file store stat
   * @example
   * ```typescript
   * const stat = alwatrStore.stat('user1/order-list');
   * console.log(stat.type); // collection
   * ```
   */
  stat(id: string, ownerId?: string): Readonly<StoreFileStat> {
    if (ownerId) id += `/${ownerId}`;
    logger.logMethodArgs?.('stat', id);
    // if (!this.rootDb_.exists(id)) throw new Error('store_file_not_defined', {cause: {id}});
    return this.rootDb_.get(id);
  }

  /**
   * Defines a document in the store with the given configuration and initial data.
   * Document defined immediately and you don't need to await, unless you want to catch writeContext errors.
   *
   * @template TDoc document data type
   * @param config store file config
   * @param initialData initial data for the document
   * @example
   * ```typescript
   * await alwatrStore.defineDocument<Order>({
   *  id: 'user1/profile',
   *  region: Region.PerUser,
   *  ttl: StoreFileTTL.medium,
   * }, {
   *   name: 'Ali',
   *   email: 'ali@alwatr.io',
   * });
   * ```
   */
  defineDocument<TDoc extends Record<string, unknown>>(stat: StoreFileStatModel, initialData: TDoc): Promise<void> {
    logger.logMethodArgs?.('defineDocument', stat.value);
    this.addStoreFile_(stat);
    const docRef = DocumentReference.newRefFromData(stat.value, initialData, this.writeContext_.bind(this))
    return this.writeContext_(stat.id, docRef.getFullContext_());
  }

  /**
   * Defines a collection in the store with the given configuration.
   * collection defined immediately and you don't need to await, unless you want to catch writeContext errors.
   *
   * @param config store file config
   * @example
   * ```typescript
   * alwatrStore.defineCollection({
   *   id: 'user1/orders',
      *   region: Region.PerUser,
   *   ttl: StoreFileTTL.medium,
   * });
   * ```
   */
  defineCollection(stat: StoreFileStatModel): Promise<void> {
    logger.logMethodArgs?.('defineCollection', stat.value);
    this.addStoreFile_(stat);
    const colRef = CollectionReference.newRefFromData(stat.value, this.writeContext_.bind(this))
    return this.writeContext_(colRef);
  }

  /**
   * Create and return a DocumentReference for a document with the given id.
   * If the document not exists or its not a document, an error is thrown.
   *
   * @template TDoc document data type
   * @param id document id
   * @returns document reference {@link DocumentReference}
   * @example
   * ```typescript
   * const doc = await alwatrStore.doc<User>('user1/profile');
   * doc.update({name: 'ali'});
   * ```
   */
  async doc<TDoc extends Record<string, unknown>>(stat: StoreFileStatModel): Promise<DocumentReference<TDoc>> {
    logger.logMethodArgs?.('doc', stat.id);
    if (!this.exists(stat)) {
      logger.accident('doc', 'document_not_found', stat.id);
      throw new Error('document_not_found', {cause: stat.id});
    }
    if (stat.value.type != StoreFileType.Document) {
      logger.accident('doc', 'document_wrong_type', stat);
      throw new Error('document_not_found', {cause: stat});
    }

    const context = await this.getContext_(stat) as DocumentContext<TDoc>;
    return DocumentReference.newRefFromContext<TDoc>(context, this.writeContext_.bind(this));
  }

  /**
   * Create and return a CollectionReference for a collection with the given id.
   * If the collection not exists or its not a collection, an error is thrown.
   *
   * @template TItem collection item data type
   * @param id collection id
   * @returns collection reference {@link CollectionReference}
   * @example
   * ```typescript
   * const collection = await alwatrStore.collection<Order>('user1/orders');
   * collection.add({name: 'order 1'});
   * ```
   */
  async collection<TItem extends Record<string, unknown>>(stat: StoreFileStatModel): Promise<CollectionReference<TItem>> {
    logger.logMethodArgs?.('collection', stat.id);
    if (this.exists(stat) === false) {
      logger.accident('collection', 'collection_not_found', stat.id);
      throw new Error('collection_not_found', {cause: stat.id});
    }
    if (stat.value.type != StoreFileType.Collection) {
      logger.accident('collection', 'collection_wrong_type', stat);
      throw new Error('collection_not_found', {cause: stat});
    }

    const context = await this.getContext_(stat) as CollectionContext<TItem>;
    return CollectionReference.newRefFromContext<TItem>(context, this.writeContext_.bind(this));
  }

  /**
   * Unloads the store file with the given id from memory.
   *
   * @param id The unique identifier of the store file.
   * @example
   * ```typescript
   * alwatrStore.unload('user1/profile');
   * alwatrStore.exists('user1/orders'); // true
   * ```
   */
  unload(stat: StoreFileStatModel): void {
    logger.logMethodArgs?.('unload', stat.id);
    // TODO: this.save_(id);
    delete this.memoryContextRecord_[stat.id];
  }

  /**
   * Deletes the store file with the given id from the store and unload it from memory.
   *
   * @param id The unique identifier of the store file.
   * @example
   * ```typescript
   * alwatrStore.deleteFile('user1/profile');
   * alwatrStore.exists('user1/orders'); // false
   * ```
   */
  deleteFile(stat: StoreFileStatModel): void {
    logger.logMethodArgs?.('deleteFile', stat.id);
    delete this.memoryContextRecord_[stat.id]; // direct unload to prevent save
    const path = this.storeFilePath_(this.stat(stat.id));
    unlink(path).catch((err) => {
      logger.accident?.('deleteFile', 'delete_file_failed', err);
    });
    this.rootDb_.delete(stat.id);
  }

  /**
   * Keep all loaded store file context loaded in memory.
   */
  private memoryContextRecord_: Record<string, StoreFileContext> = {};

  /**
   * Get store file context.
   * If the store file not exists, an error is thrown.
   * If the store file is loaded, it will be returned from memory.
   * If the store file is not loaded, it will be loaded from disk.
   *
   * @param id The unique identifier of the store file.
   * @returns store file context
   * @example
   * ```typescript
   * const context = await this.getContext_('user1/profile');
   * console.log(context.data.name); // ali
   * ```
   */
  protected async getContext_(stat: StoreFileStatModel): Promise<StoreFileContext> {
    logger.logMethodArgs?.('getContext_', stat.id);
    return this.memoryContextRecord_[stat.id] ?? this.readContext_(stat);
  }

  protected async readContext_(stat: StoreFileStatModel): Promise<StoreFileContext> {
    logger.logMethodArgs?.('readContext_', stat.id);
    logger.time?.(`readContextTime(${stat.id})`);
    const context = (await readJsonFile(stat.path)) as StoreFileContext;
    // AlwatrStore.validateStoreFile_(context);
    this.memoryContextRecord_[stat.id] = context;
    logger.timeEnd?.(`readContextTime(${stat.id})`);
    return context;
  }

  /**
   * Write store file context.
   *
   * @param id The unique identifier of the store file.
   * @param context The store file context. If not provided, it will be loaded from memory.
   * @param sync If true, the file will be written synchronously.
   * @example
   * ```typescript
   * await this.writeContext_('user1/profile', {data: {name: 'ali'}});
   * ```
   */
  protected async writeContext_(from: DocumentReference | CollectionReference, sync = false): Promise<void> {
    logger.logMethodArgs?.('writeContext', from.id);
    logger.time?.(`writeContextTime(${from.id})`);
    this.memoryContextRecord_[from.id] = from.getFullContext_();
    await writeJsonFile(from.path, from.getFullContext_(), WriteFileMode.Rename, sync);
    logger.timeEnd?.(`writeContextTime(${from.id})`);
    logger.logOther?.('writeContextDone', from.id);
  }

  /**
   * Calculate store file path.
   *
   * @param stat The store file stat.
   * @returns store file path
   * @example
   * ```typescript
   * const path = this.storeFilePath_({
   *   id: 'user1/profile',
   *   region: Region.Secret,
   *   type: StoreFileType.document,
   *   encoding: StoreFileEncoding.json,
   * });
   * console.log(path); // /rootPath/s/user1/profile.doc.ajs
   * ```
   */
  protected storeFilePath_(stat: StoreFileStat): string {
    let regionPath: string = stat.region;
    if (stat.ownerId !== undefined) {
      regionPath += `/${stat.ownerId.slice(0, 3)}/${stat.ownerId}`;
    }
    return resolve(this.config_.rootPath, regionPath, `${stat.id}.${stat.type}.${stat.extension}`);
  }

  /**
   * Load storeFilesCollection or create new one.
   */
  protected loadRootDb_(): CollectionReference<StoreFileStat> {
    logger.logMethod?.('loadRootDb_');
    const path = this.storeFilePath_(AlwatrStore.rootDbStat_);
    let colRef;
    if (existsSync(path)) {
      const context = readJsonFile(path, true) as CollectionContext<StoreFileStat>;
      colRef = CollectionReference.newRefFromContext(context, this.writeContext_.bind(this));
    }
    else {
      logger.banner('Initialize new alwatr-store');
      colRef = CollectionReference.newRefFromData({
        name: AlwatrStore.rootDbStat_.name,
        region: AlwatrStore.rootDbStat_.region,
        extension: StoreFileExtension.Json,
        type: StoreFileType.Collection,
      }, this.writeContext_.bind(this));
    }

    return colRef
  }

  /**
   * @param stat store file stat
   *
   * Adds a new store file to the root storeFilesCollection.
   */
  protected addStoreFile_(stat: StoreFileStatModel) {
    logger.logMethodArgs?.('_addStoreFile', stat.value);
    this.rootDb_.create(stat.id, stat.value);
  }
}
