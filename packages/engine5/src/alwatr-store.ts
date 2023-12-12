import {CollectionReference} from './lib/collection-reference.js';
import {DocumentReference} from './lib/document-reference.js';
import {logger} from './lib/logger.js';
import {
  StoreFileType,
  StoreFileEncoding,
  Region,
  type StoreFileStat,
  type AlwatrStoreConfig,
  type StoreFileContext,
  type CollectionItem,
} from './type.js';

logger.logModule?.('alwatr-store');

/**
 * AlwatrStore is a class that provides methods to interact with the store.
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
   * @template TData store file data type
   * @param stat store file stat
   * @returns store file context
   *
   * Reads a store file and returns its context.
   */
  protected static async readStoreFile_<TData extends Record<string, unknown>>(
    stat: StoreFileStat,
  ): Promise<StoreFileContext<TData>> {
    logger.logMethodArgs?.('readStoreFile', stat.id);
    const context = DocumentReference.newContext_(stat.id, stat.region, {} as TData);
    AlwatrStore.validateStoreFile_(context);
    return context;
  }

  /**
   * @param stat store file stat
   * @param context store file context
   *
   * Writes a store file with the provided context.
   */
  protected static async writeStoreFile_(
    stat: StoreFileStat,
    context: StoreFileContext<Record<string, unknown>>,
  ): Promise<void> {
    logger.logMethodArgs?.('writeStoreFile', stat.id);
    logger.logProperty?.('context', context); // tmp
  }

  /**
   * @param context store file context
   *
   * Validates a store file with the provided context and try to migrate if needed.
   */
  protected static validateStoreFile_(context: StoreFileContext<Record<string, unknown>>): void {
    logger.logMethodArgs?.('_validateStoreFile', {id: context.meta});

    if (context.ok !== true) {
      throw new Error('store_not_ok', {cause: context});
    }

    if (context.meta?.ver !== AlwatrStore.version) {
      logger.accident?.('_validateStoreFile', 'store_version_incompatible', {
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
          throw new Error('store_file_type_not_supported', {cause: context.meta});
      }
    }
  }

  /**
   * `collectionReference` of all `storeFileStat`s.
   *
   * This is the root store document.
   */
  protected storeFilesCollection_;

  /**
   * Keep all loaded store file context loaded in memory.
   */
  protected memoryContextRecord_: Record<string, StoreFileContext> = {};

  /**
   * @param config
   *
   * Constructs an AlwatrStore instance with the provided configuration.
   *
   * @example
   * ```typescript
   * const alwatrStore = new AlwatrStore({
   *   rootPath: './db',
   *   saveDebounce: 1000,
   * });
   * ```
   */
  constructor(readonly config: AlwatrStoreConfig) {
    logger.logMethodArgs?.('new', config);
    this.storeFilesCollection_ = this.loadRootStoreDocument_();
  }

  /**
   * @returns document reference of the root store document
   *
   * Loads the root store document or creates a new one if it doesn't exist.
   *
   * The root store document is a collection of all store file stats.
   */
  protected loadRootStoreDocument_(): DocumentReference<Record<string, StoreFileStat>> {
    // TODO: load root meta or make empty and save
    const context = DocumentReference.newContext_<Record<string, StoreFileStat>>('.store-files', Region.Secret, {});
    return new DocumentReference(context, this.rootStoreUpdated_.bind(this));
  }

  /**
   * Handles updates to the root store document.
   */
  protected rootStoreUpdated_() {
    logger.logMethod?.('rootStoreUpdated_');
    // TODO: save
  }

  /**
   * @param stat store file stat
   *
   * Adds a new store file to the root storeFilesCollection.
   */
  protected addStoreFile_(stat: StoreFileStat) {
    logger.logMethodArgs?.('_addStoreFile', stat);
    this.storeFilesCollection_.update({[stat.id]: stat});
  }

  /**
   * @param id store file id
   * @returns true if a store file with the given id exists, false otherwise
   *
   * Checks if a store file with the given id exists.
   *
   * @example
   * ```typescript
   * const exists = await alwatrStore.exists('user1/profile');
   * ```
   */
  exists(id: string): boolean {
    const exists = id in this.storeFilesCollection_.get();
    logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  /**
   * @param id store file id
   * @returns file store stat
   *
   * Returns the stats of a store file with the given id from the root store document.
   *
   * @example
   * ```typescript
   * const stat = alwatrStore.stat('user1/orders');
   *
   * console.log(stat.type); // document
   * ```
   */
  stat(id: string): Readonly<StoreFileStat> {
    const stat = this.storeFilesCollection_.get()[id] ?? null;
    logger.logMethodFull?.('stat', id, stat);
    // TODO: error store_file_not_defined
    return stat;
  }

  /**
   * @template TDoc document data type
   * @param config store file config
   * @param initialData initial data for the document
   *
   * Defines a document in the store with the given configuration and initial data.
   *
   * @example
   * ```typescript
   * await alwatrStore.defineDocument<Order>({
   *  id: 'user1/profile',
   *  region: Region.PerUser,
   *  ttl: StoreFileTTL.medium,
   * }, {
   *   name: 'Copilot',
   *   email: 'copilot@github.com',
   * });
   * ```
   */
  defineDocument<TDoc extends Record<string, unknown>>(
    config: Pick<StoreFileStat, 'id' | 'region' | 'ttl'>,
    initialData: TDoc,
  ): Promise<void> {
    logger.logMethodArgs?.('defineDocument', config);

    const stat: StoreFileStat = {
      ...config,
      type: StoreFileType.document,
      encoding: StoreFileEncoding.json,
    };

    this.addStoreFile_(stat);
    return AlwatrStore.writeStoreFile_(stat, DocumentReference.newContext_(config.id, config.region, initialData));
  }

  /**
   * @param config store file config
   *
   * Defines a collection in the store with the given configuration.
   *
   * @example
   * ```typescript
   * await alwatrStore.defineCollection({
   *   id: 'user1/orders',
   *   region: Region.PerUser,
   *   ttl: StoreFileTTL.medium,
   * });
   * ```
   */
  defineCollection(config: Pick<StoreFileStat, 'id' | 'region' | 'ttl'>): Promise<void> {
    logger.logMethodArgs?.('defineCollection', config);

    const stat: StoreFileStat = {
      ...config,
      type: StoreFileType.collection,
      encoding: StoreFileEncoding.json,
    };

    this.addStoreFile_(stat);
    return AlwatrStore.writeStoreFile_(stat, CollectionReference.newContext_(config.id, config.region));
  }

  /**
   * @template TDoc document data type
   * @param id document id
   * @returns document reference {@link DocumentReference}
   *
   * Returns a DocumentReference for a document with the given id, or throws an error if it doesn't exist.
   *
   * @example
   * ```typescript
   * const doc = await alwatrStore.doc<Order>('user1/profile');
   *
   * doc.update({name: 'Copilot2'});
   * ```
   */
  async doc<TDoc extends Record<string, unknown>>(id: string): Promise<DocumentReference<TDoc>> {
    logger.logMethodArgs?.('doc', id);
    const stat = this.stat(id);
    if (stat == null) throw new Error('document_not_found', {cause: {id}});
    if (stat.type != StoreFileType.document) {
      logger.error?.('doc', 'document_wrong_type', stat);
      throw new Error('document_not_found', {cause: stat});
    }
    const context = (this.memoryContextRecord_[id] = await AlwatrStore.readStoreFile_<TDoc>(stat));
    return new DocumentReference(context, this.save_.bind(this));
  }
  /**
   * @template TItem collection item data type
   * @param id collection id
   * @returns collection reference {@link CollectionReference}
   *
   * Returns a CollectionReference for a collection with the given id.
   *
   * @example
   * ```typescript
   * const collection = await alwatrStore.collection<Order>('user1/orders');
   *
   * collection.create({name: 'order2'});
   * ```
   */
  async collection<TItem extends Record<string, unknown>>(id: string): Promise<CollectionReference<TItem>> {
    logger.logMethodArgs?.('collection', id);
    const stat = this.stat(id);
    if (stat == null) throw new Error('collection_not_found', {cause: {id}});
    if (stat.type != StoreFileType.collection) {
      logger.error?.('collection', 'collection_wrong_type', stat);
      throw new Error('collection_not_found', {cause: stat});
    }
    const context = (this.memoryContextRecord_[id] =
      await AlwatrStore.readStoreFile_<Record<string, CollectionItem<TItem>>>(stat));
    return new CollectionReference(context, this.save_.bind(this));
  }

  /**
   * @param id store file id
   *
   * Saves the store file with the given id based throttle settings.
   */
  protected async save_(id: string): Promise<void> {
    logger.logMethodArgs?.('updated_', id);
    const stat = this.stat(id);
    if (stat === null) {
      logger.error?.('updated_', 'store_file_not_defined', {id});
      return;
    }
    const context = this.memoryContextRecord_[id];
    if (context === undefined) {
      logger.error?.('updated_', 'store_file_unloaded', {id});
      return;
    }
    await AlwatrStore.writeStoreFile_(stat, context);
  }

  /**
   * @param id store file id
   *
   * Unloads the store file with the given id from memory.
   *
   * @example
   * ```typescript
   * alwatrStore.unload('user1/orders');
   * ```
   */
  unload(id: string): void {
    logger.logMethodArgs?.('unload', id);
    // TODO: this.save_(id);
    delete this.memoryContextRecord_[id];
  }

  /**
   * @param id store file id
   *
   * Deletes the store file with the given id from the store and memory.
   *
   * @example
   * ```typescript
   * alwatrStore.deleteFile('user1/orders');
   *
   * alwatrStore.exists('user1/orders'); // false
   * ```
   */
  deleteFile(id: string): void {
    logger.logMethodArgs?.('deleteFile', id);
    if (id in this.memoryContextRecord_) {
      this.unload(id);
    }
    // TODO: AlwatrStore.deleteStoreFile_(this.stat(id));
    delete this.storeFilesCollection_.get()[id];
  }
}
