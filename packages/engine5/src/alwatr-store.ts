import {CollectionReference} from './lib/collection-reference.js';
import {DocumentReference} from './lib/document-reference.js';
import {logger} from './lib/logger.js';
import {WriteFileMode, existsSync, readJsonFile, resolve, unlink, writeJsonFile} from './lib/util.js';
import {
  StoreFileType,
  StoreFileEncoding,
  Region,
  StoreFileTTL,
  StoreFileId,
  type AlwatrStoreConfig,
  type StoreFileContext,
  type CollectionContext,
  type DocumentContext,
  type StoreFileAddress,
} from './type.js';

export {Region, StoreFileTTL};

logger.logModule?.('alwatr-store');

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
  protected static readonly rootDbId_: StoreFileId = new StoreFileId({
    id: '.store',
    region: Region.Secret,
    type: StoreFileType.collection,
    encoding: StoreFileEncoding.json,
    ttl: StoreFileTTL.maximum,
  });

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
        case StoreFileType.document: {
          DocumentReference.migrateContext_(context);
          break;
        }

        case StoreFileType.collection: {
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
        logger.accident('validateStoreFile_', 'store_address_owner_id_not_defined', context.meta);
        throw new Error('store_address_owner_id_not_defined', {cause: context.meta});
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
  exists(address: StoreFileId): boolean {
    const exists = this.rootDb_.exists(address.toString());
    logger.logMethodFull?.('exists', address, exists);
    return exists;
  }

  /**
   * Defines a document in the store with the given configuration and initial data.
   * Document defined immediately and you don't need to await, unless you want to catch writeContext errors.
   *
   * @template TDoc document data type
   * @param id store file config
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
  defineDocument<TDoc extends Record<string, unknown>>(id: StoreFileId, initialData: TDoc): Promise<void> {
    logger.logMethodArgs?.('defineDocument', id);
    this.addStoreFile_(id);
    return this.writeContext_(id.value, DocumentReference.newContext_(id, initialData));
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
  defineCollection(id: StoreFileId): Promise<void> {
    logger.logMethodArgs?.('defineCollection', {id});
    this.addStoreFile_(id);
    return this.writeContext_(id.value, CollectionReference.newContext_(id));
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
  async doc<TDoc extends Record<string, unknown>>(id: StoreFileId): Promise<DocumentReference<TDoc>> {
    logger.logMethodArgs?.('doc', id);
    if (!this.exists(id)) {
      logger.accident('doc', 'document_not_found', {id});
      throw new Error('document_not_found', {cause: {id}});
    }
    if (id.type != StoreFileType.document) {
      logger.accident('doc', 'document_wrong_type', id);
      throw new Error('document_not_found', {cause: id});
    }
    return new DocumentReference((await this.getContext_(id)) as DocumentContext<TDoc>, this.writeContext_.bind(this));
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
  async collection<TItem extends Record<string, unknown>>(id: StoreFileId): Promise<CollectionReference<TItem>> {
    logger.logMethodArgs?.('collection', id);
    if (this.exists(id) === false) {
      logger.accident('collection', 'collection_not_found', {id});
      throw new Error('collection_not_found', {cause: {id}});
    }
    if (id.type != StoreFileType.collection) {
      logger.accident('collection', 'collection_wrong_type', id);
      throw new Error('collection_not_found', {cause: id});
    }
    return new CollectionReference(
      (await this.getContext_(id)) as CollectionContext<TItem>,
      this.writeContext_.bind(this),
    );
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
  unload(address: StoreFileId): void {
    logger.logMethodArgs?.('unload', address);
    // TODO: this.save_(address);
    delete this.memoryContextRecord_[address.toString()];
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
  deleteFile(id: StoreFileId): void {
    logger.logMethodArgs?.('deleteFile', id);
    delete this.memoryContextRecord_[id.toString()]; // direct unload to prevent save
    const path = this.storeFilePath_(id.value);
    unlink(path).catch((err) => {
      logger.accident?.('deleteFile', 'delete_file_failed', err);
    });
    this.rootDb_.delete(id.toString());
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
  protected async getContext_(id: StoreFileId): Promise<StoreFileContext> {
    logger.logMethodArgs?.('getContext_', id);
    return this.memoryContextRecord_[id.toString()] ?? this.readContext_(id);
  }

  protected async readContext_(id: StoreFileId): Promise<StoreFileContext> {
    logger.logMethodArgs?.('readContext_', id);
    logger.time?.(`readContextTime(${id})`);
    const path = this.storeFilePath_(id.value);
    const context = (await readJsonFile(path)) as StoreFileContext;
    AlwatrStore.validateStoreFile_(context);
    this.memoryContextRecord_[id.toString()] = context;
    logger.timeEnd?.(`readContextTime(${id})`);
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
  protected async writeContext_(id: StoreFileAddress, context: StoreFileContext, sync = false): Promise<void> {
    logger.logMethodArgs?.('writeContext', id);
    logger.time?.(`writeContextTime(${id})`);
    id = id.id === AlwatrStore.rootDbId_.id ? AlwatrStore.rootDbId_.value : id;
    const path = this.storeFilePath_(id);
    this.memoryContextRecord_[id.toString()] = context;
    await writeJsonFile(path, context, WriteFileMode.Rename, sync);
    logger.timeEnd?.(`writeContextTime(${id})`);
    logger.logOther?.('writeContextDone', id);
  }

  /**
   * Calculate store file path.
   *
   * @param id The store file stat.
   * @returns store file path
   * @example
   * ```typescript
   * const path = this.storeFilePath_({
   *   address: {
   *     name: 'profile',
   *     ownerId: 'user1',
   *   },
   *   region: Region.Secret,
   *   type: StoreFileType.document,
   *   encoding: StoreFileEncoding.json,
   * });
   * console.log(path); // /rootPath/s/use/user1/profile.doc.ajs
   * ```
   */
  protected storeFilePath_(id: StoreFileAddress): string {
    let regionPath: string = id.region;
    if (id.ownerId !== undefined) {
      regionPath += `/${id.ownerId.slice(0, 3)}/${id.ownerId}`;
    }
    return resolve(this.config_.rootPath, regionPath, `${id.id}.${id.type}.${id.encoding}`);
  }

  /**
   * Load storeFilesCollection or create new one.
   */
  protected loadRootDb_(): CollectionReference<StoreFileAddress> {
    logger.logMethod?.('loadRootDb_');
    const path = this.storeFilePath_(AlwatrStore.rootDbId_.value);
    let context;
    if (existsSync(path)) {
      context = readJsonFile(path, true) as CollectionContext<StoreFileAddress>;
      AlwatrStore.validateStoreFile_(context);
    }
    else {
      logger.banner('Initialize new alwatr-store');
      context = CollectionReference.newContext_<StoreFileAddress>(AlwatrStore.rootDbId_);
      this.writeContext_(AlwatrStore.rootDbId_.value, context, true);
    }
    return new CollectionReference(context, this.writeContext_.bind(this));
  }

  /**
   * @param id store file stat
   *
   * Adds a new store file to the root storeFilesCollection.
   */
  protected addStoreFile_(id: StoreFileId) {
    logger.logMethodArgs?.('_addStoreFile', id);
    this.rootDb_.create(id.toString(), id.value);
  }
}
