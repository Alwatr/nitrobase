import {exitHook} from '@alwatr/exit-hook';
import {existsSync, readJson, resolve, unlink, writeJson} from '@alwatr/node-fs';
import {CollectionReference, DocumentReference, getStoreId, getStorePath} from '@alwatr/store-reference';
import {
  StoreFileType,
  StoreFileExtension,
  Region,
  type StoreFileStat,
  type StoreFileContext,
  type CollectionContext,
  type DocumentContext,
  type StoreFileId,
} from '@alwatr/store-types';
import {waitForTimeout} from '@alwatr/wait';

import {logger} from './logger.js';

import type {Dictionary, JsonifiableObject} from '@alwatr/type-helper';

logger.logModule?.('alwatr-store');

/**
 * AlwatrStore configuration.
 */
export interface AlwatrStoreConfig {
  /**
   * The root path of the storage.
   * This is where the AlwatrStore will store its data.
   */
  rootPath: string;

  /**
   * The save debounce timeout in milliseconds for minimal disk I/O usage.
   * This is used to limit the frequency of disk writes for performance reasons.
   * The recommended value is `40`.
   */
  defaultChangeDebounce?: number;

  /**
   * If true, an error will be thrown when trying to read or write to a store file that is not initialized (new storage).
   * The default value is `false` but highly recommended to set it to `true` in production to prevent data loss.
   */
  errorWhenNotInitialized?: boolean;
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
  static readonly version = __package_version__;

  static getStoreId = getStoreId;

  /**
   * The root store file stat.
   */
  private static readonly rootDbStat__: StoreFileStat = {
    name: '.store',
    region: Region.Secret,
    type: StoreFileType.Collection,
    extension: StoreFileExtension.Json,
    changeDebounce: 40,
  };

  /**
   * `collectionReference` of all `storeFileStat`s.
   * This is the root store collection.
   */
  private rootDb__;

  /**
   * Keep all loaded store file context loaded in memory.
   */
  private cacheReferences__: Dictionary<DocumentReference | CollectionReference> = {};

  /**
   * Constructs an AlwatrStore instance with the provided configuration.
   *
   * @param config__ The configuration of the AlwatrStore engine.
   * @example
   * ```typescript
   * const alwatrStore = new AlwatrStore({
   *   rootPath: './db',
   *   saveDebounce: 40,
   * });
   * ```
   */
  constructor(private readonly config__: AlwatrStoreConfig) {
    logger.logMethodArgs?.('new', config__);
    this.config__.defaultChangeDebounce ??= 40;
    this.rootDb__ = this.loadRootDb__();
    exitHook(this.exitHook__.bind(this));
  }

  /**
   * Checks if a store file with the given ID exists.
   *
   * @param id - The ID of the store file to check.
   * @returns `true` if the store file exists, `false` otherwise.
   * @example
   * ```typescript
   * if (!alwatrStore.exists('user1/profile')) {
   *  alwatrStore.defineDocument(...)
   * }
   * ```
   */
  exists(id: StoreFileId): boolean {
    const id_ = getStoreId(id);
    const exists = this.rootDb__.exists(id_);
    logger.logMethodFull?.('exists', id_, exists);
    return exists;
  }

  /**
   * Defines a new document with the given configuration and initial data.
   * If a document with the same ID already exists, an error is thrown.
   *
   * @param stat store file stat
   * @param initialData initial data for the document
   * @template TDoc document data type
   * @example
   * ```typescript
   * await alwatrStore.newDocument<Order>(
   *   {
   *     name: 'profile',
   *     region: Region.PerUser,
   *     ownerId: 'user1',
   *   },
   *   {
   *     name: 'Ali',
   *     email: 'ali@alwatr.io',
   *   }
   * );
   * ```
   */
  newDocument<T extends JsonifiableObject = JsonifiableObject>(
    stat: Omit<StoreFileStat, 'type'>,
    initialData: DocumentContext<T>['data'] | null = null,
  ): void {
    logger.logMethodArgs?.('newDocument', stat);
    return this.newStoreFile_(
      {
        ...stat,
        type: StoreFileType.Document,
      },
      initialData,
    );
  }

  /**
   * Defines a new collection with the given configuration and initial data.
   * If a collection with the same ID already exists, an error is thrown.
   *
   * @param stat store file stat
   * @param initialData initial data for the collection
   * @template TItem collection item data type
   * @example
   * ```typescript
   * await alwatrStore.newCollection<Order>(
   *   {
   *     name: 'orders',
   *     region: Region.PerUser,
   *     ownerId: 'user1',
   *   }
   * );
   * ```
   */
  newCollection<TItem extends JsonifiableObject = JsonifiableObject>(
    stat: Omit<StoreFileStat, 'type'>,
    initialData: CollectionContext<TItem>['data'] | null = null,
  ): void {
    logger.logMethodArgs?.('newCollection', stat);
    return this.newStoreFile_(
      {
        ...stat,
        type: StoreFileType.Collection,
      },
      initialData,
    );
  }

  /**
   * Defines a AlwatrStoreFile with the given configuration and initial data.
   *
   * @param stat store file stat
   * @param initialData initial data for the document
   * @template TDoc document data type
   */
  newStoreFile_<T extends JsonifiableObject = JsonifiableObject>(
    stat: StoreFileStat,
    initialData: DocumentContext<T>['data'] | CollectionContext<T>['data'] | null = null,
  ): void {
    logger.logMethodArgs?.('newStoreFile_', stat);

    (stat.changeDebounce as number | undefined) ??= this.config__.defaultChangeDebounce;

    let fileStoreRef: DocumentReference | CollectionReference;
    if (stat.type === StoreFileType.Document) {
      fileStoreRef = DocumentReference.newRefFromData(stat, initialData as DocumentContext['data'], this.storeChanged__.bind(this));
    }
    else if (stat.type === StoreFileType.Collection) {
      fileStoreRef = CollectionReference.newRefFromData(stat, initialData as CollectionContext['data'], this.storeChanged__.bind(this));
    }
    else {
      logger.accident('newStoreFile_', 'store_file_type_not_supported', stat);
      throw new Error('store_file_type_not_supported', {cause: stat});
    }

    if (this.rootDb__.exists(fileStoreRef.id)) {
      logger.accident('newStoreFile_', 'store_file_already_defined', stat);
      throw new Error('store_file_already_defined', {cause: stat});
    }

    this.rootDb__.create(fileStoreRef.id, stat);
    this.cacheReferences__[fileStoreRef.id] = fileStoreRef;

    // fileStoreRef.save();
    this.storeChanged__(fileStoreRef);
  }

  /**
   * Open a document with the given id and create and return a DocumentReference.
   * If the document not exists or its not a document, an error is thrown.
   *
   * @template TDoc document data type
   * @param id_ document id
   * @returns document reference {@link DocumentReference}
   * @example
   * ```typescript
   * const userProfile = await alwatrStore.openDocument<User>({
   *   name: 'user1/profile',
   *   region: Region.PerUser,
   *   ownerId: 'user1',
   * });
   * userProfile.update({name: 'ali'});
   * ```
   */
  async openDocument<TDoc extends JsonifiableObject>(id: StoreFileId): Promise<DocumentReference<TDoc>> {
    const id_ = getStoreId(id);
    logger.logMethodArgs?.('openDocument', id_);

    if (Object.hasOwn(this.cacheReferences__, id_)) {
      const ref = this.cacheReferences__[id_];
      if (!(ref instanceof DocumentReference)) {
        logger.accident('openDocument', 'document_wrong_type', id_);
        throw new Error('document_wrong_type', {cause: id_});
      }
      return this.cacheReferences__[id_] as unknown as DocumentReference<TDoc>;
    }

    if (!this.rootDb__.exists(id_)) {
      logger.accident('openDocument', 'document_not_found', id_);
      throw new Error('document_not_found', {cause: id_});
    }

    const storeStat = this.rootDb__.get(id_);

    if (storeStat.type != StoreFileType.Document) {
      logger.accident('openDocument', 'document_wrong_type', id_);
      throw new Error('document_wrong_type', {cause: id_});
    }

    const context = await this.readContext__<DocumentContext<TDoc>>(storeStat);
    const docRef = DocumentReference.newRefFromContext(context, this.storeChanged__.bind(this));
    this.cacheReferences__[id_] = docRef as unknown as DocumentReference;
    return docRef;
  }

  /**
   * Open a collection with the given id and create and return a CollectionReference.
   * If the collection not exists or its not a collection, an error is thrown.
   *
   * @template TItem collection item data type
   * @param id_ collection id
   * @returns collection reference {@link CollectionReference}
   * @example
   * ```typescript
   * const orders = await alwatrStore.openCollection<Order>({
   *   name: 'orders',
   *   region: Region.PerUser,
   *   ownerId: 'user1',
   * });
   * orders.append({name: 'order 1'});
   * ```
   */
  async openCollection<TItem extends JsonifiableObject>(id: StoreFileId): Promise<CollectionReference<TItem>> {
    const id_ = getStoreId(id);
    logger.logMethodArgs?.('openCollection', id_);

    // try to get from cache
    if (Object.hasOwn(this.cacheReferences__, id_)) {
      const ref = this.cacheReferences__[id_];
      if (!(ref instanceof CollectionReference)) {
        logger.accident('openCollection', 'collection_wrong_type', id_);
        throw new Error('collection_wrong_type', {cause: id_});
      }
      return this.cacheReferences__[id_] as unknown as CollectionReference<TItem>;
    }

    // load and create new collection reference
    if (!this.rootDb__.exists(id_)) {
      logger.accident('openCollection', 'collection_not_found', id_);
      throw new Error('collection_not_found', {cause: id_});
    }

    const storeStat = this.rootDb__.get(id_);

    if (storeStat.type != StoreFileType.Collection) {
      logger.accident('openCollection', 'collection_wrong_type', id_);
      throw new Error('collection_not_found', {cause: id_});
    }

    const context = await this.readContext__<CollectionContext<TItem>>(storeStat);
    const colRef = CollectionReference.newRefFromContext(context, this.storeChanged__.bind(this));
    this.cacheReferences__[id_] = colRef as unknown as CollectionReference;
    return colRef;
  }

  /**
   * Unloads the store file with the given id from memory.
   *
   * @param id_ The unique identifier of the store file.
   * @example
   * ```typescript
   * alwatrStore.unload({name: 'user-list', region: Region.Secret});
   * alwatrStore.exists({name: 'user-list', region: Region.Secret}); // true
   * ```
   */
  unload(id: StoreFileId): void {
    const id_ = getStoreId(id);
    logger.logMethodArgs?.('unload', id_);
    const ref = this.cacheReferences__[id_];
    if (ref === undefined) return;
    if (ref.hasUnprocessedChanges_ === true) {
      ref.updateDelayed_ = false;
      this.storeChanged__(ref);
    }
    delete this.cacheReferences__[id_];
  }

  /**
   * Remove document or collection from store and delete the file from disk.
   * If the file is not found, an error is thrown.
   * If the file is not unloaded, it will be unloaded first.
   * You don't need to await this method to complete unless you want to make sure the file is deleted on disk.
   *
   * @param id_ The ID of the file to delete.
   * @returns A Promise that resolves when the file is deleted.
   * @example
   * ```typescript
   * alwatrStore.remove({name: 'user-list', region: Region.Secret});
   * alwatrStore.exists({name: 'user-list', region: Region.Secret}); // false
   * ```
   */
  async remove(id: StoreFileId): Promise<void> {
    const id_ = getStoreId(id);
    logger.logMethodArgs?.('remove', id_);
    if (!this.rootDb__.exists(id_)) {
      logger.accident('doc', 'document_not_found', id_);
      throw new Error('document_not_found', {cause: id_});
    }
    const ref = this.cacheReferences__[id_];
    if (ref !== undefined) {
      // direct unload to prevent save
      ref.updateDelayed_ = false;
      ref.hasUnprocessedChanges_ = false;
      delete this.cacheReferences__[id_]; // unload
    }
    const path = getStorePath(this.rootDb__.get(id_));
    this.rootDb__.delete(id_);
    await waitForTimeout(0);
    try {
      await unlink(resolve(this.config__.rootPath, path));
    }
    catch (error) {
      logger.error('deleteFile', 'remove_file_failed', error, {id, path});
    }
  }

  /**
   * Saves all changes in the store.
   * @returns A Promise that resolves when all changes are saved.
   * @example
   * ```typescript
   * await alwatrStore.saveAll();
   * ```
   */
  async saveAll(): Promise<void> {
    logger.logMethod?.('saveAll');
    for (const ref of Object.values(this.cacheReferences__)) {
      if (ref.hasUnprocessedChanges_ === true && ref.freeze !== true) {
        ref.updateDelayed_ = false;
        await this.storeChanged__(ref);
      }
    }
  }

  /**
   * Reads the context from a given path or StoreFileStat object.
   *
   * @param path The path or StoreFileStat object from which to read the context.
   * @returns A promise that resolves to the context object.
   */
  private async readContext__<T extends StoreFileContext>(path: string | StoreFileStat): Promise<T> {
    if (typeof path !== 'string') path = getStorePath(path);
    logger.logMethodArgs?.('readContext__', path);
    logger.time?.(`readContext__time(${path})`);
    const context = (await readJson(resolve(this.config__.rootPath, path))) as T;
    logger.timeEnd?.(`readContext__time(${path})`);
    return context;
  }

  /**
   * Writes the context to the specified path.
   *
   * @template T The type of the context.
   * @param path The path where the context will be written.
   * @param context The context to be written.
   * @param sync Indicates whether the write operation should be synchronous.
   * @returns A promise that resolves when the write operation is complete.
   */
  private async writeContext__<T extends StoreFileContext>(path: string | StoreFileStat, context: T): Promise<void> {
    if (typeof path !== 'string') path = getStorePath(path);
    logger.logMethodArgs?.('writeContext__', path);
    logger.time?.(`writeContext__time(${path})`);
    await writeJson(resolve(this.config__.rootPath, path), context);
    logger.timeEnd?.(`writeContext__time(${path})`);
  }

  /**
   * Write store file context.
   *
   * @param id The unique identifier of the store file.
   * @param context The store file context. If not provided, it will be loaded from memory.
   * @param sync If true, the file will be written synchronously.
   */
  protected async storeChanged__<T extends JsonifiableObject>(from: DocumentReference<T> | CollectionReference<T>): Promise<void> {
    logger.logMethodArgs?.('storeChanged__', from.id);
    const rev = from.meta().rev;
    try {
      await this.writeContext__(from.path, from.getFullContext_());
      if (rev === from.meta().rev) {
        // Context not changed during saving
        from.hasUnprocessedChanges_ = false;
      }
    }
    catch (error) {
      logger.error('storeChanged__', 'write_context_failed', {id: from.id, error});
    }
  }

  /**
   * Load storeFilesCollection or create new one.
   */
  private loadRootDb__(): CollectionReference<StoreFileStat> {
    logger.logMethod?.('loadRootDb__');
    const fullPath = resolve(this.config__.rootPath, getStorePath(AlwatrStore.rootDbStat__));
    if (!existsSync(fullPath)) {
      if (this.config__.errorWhenNotInitialized === true) {
        throw new Error('store_not_found', {cause: 'Store not initialized'});
      }

      logger.banner('Initialize new alwatr-store');
      return CollectionReference.newRefFromData(AlwatrStore.rootDbStat__, null, this.storeChanged__.bind(this));
    }
    // else
    const context = readJson<CollectionContext<StoreFileStat>>(fullPath, true);
    return CollectionReference.newRefFromContext(context, this.storeChanged__.bind(this), 'root-db');
  }

  /**
   * Save all store files.
   */
  private exitHook__(): void {
    logger.logMethod?.('exitHook__');
    for (const ref of Object.values(this.cacheReferences__)) {
      logger.logProperty?.(`StoreFile.${ref.id}.hasUnprocessedChanges`, ref.hasUnprocessedChanges_);
      if (ref.hasUnprocessedChanges_ === true && ref.freeze !== true) {
        logger.incident?.('exitHook__', 'rescue_unsaved_context', {id: ref.id});
        writeJson(resolve(this.config__.rootPath, ref.path), ref.getFullContext_(), true);
        ref.hasUnprocessedChanges_ = false;
      }
    }
  }
}
