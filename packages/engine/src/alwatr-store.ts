import {exitHook} from '@alwatr/exit-hook';
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
import {Dictionary} from '@alwatr/type-helper';
import {waitForTimeout} from '@alwatr/wait';

import {WriteFileMode, existsSync, readJsonFile, resolve, unlink, writeJsonFile} from './lib/node-fs.js';
import {logger} from './logger.js';

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
  exists(id: string | StoreFileId): boolean {
    if (typeof id !== 'string') id = getStoreId(id);
    const exists = this.rootDb__.exists(id);
    logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  /**
   * Defines a AlwatrStoreFile with the given configuration and initial data.
   *
   * @param stat store file stat
   * @param initialData initial data for the document
   * @template TDoc document data type
   * @example
   * ```typescript
   * await alwatrStore.defineDocument<Order>({
   *  name: 'profile',
   *  region: Region.PerUser,
   *  ownerId: 'user1',
   *  type: StoreFileType.Document,
   *  extension: StoreFileExtension.Json,
   * }, {
   *   name: 'Ali',
   *   email: 'ali@alwatr.io',
   * });
   * ```
   */
  defineStoreFile<T extends Dictionary<unknown> = Dictionary<unknown>>(
    stat: StoreFileStat,
    initialData: DocumentContext<T>['data'] | CollectionContext<T>['data'] | null = null,
  ): void {
    logger.logMethodArgs?.('defineStoreFile', stat);

    (stat.changeDebounce as number | undefined) ??= this.config__.defaultChangeDebounce;

    let fileStoreRef: DocumentReference | CollectionReference;
    if (stat.type === StoreFileType.Document) {
      fileStoreRef = DocumentReference.newRefFromData(stat, initialData as DocumentContext['data'], this.storeChanged__.bind(this));
    }
    else if (stat.type === StoreFileType.Collection) {
      fileStoreRef = CollectionReference.newRefFromData(stat, initialData as CollectionContext['data'], this.storeChanged__.bind(this));
    }
    else {
      logger.accident('defineDocument', 'store_file_type_not_supported', stat);
      throw new Error('store_file_type_not_supported', {cause: stat});
    }

    if (this.rootDb__.exists(fileStoreRef.id)) {
      logger.accident('defineDocument', 'store_file_already_defined', stat);
      throw new Error('store_file_already_defined', {cause: stat});
    }

    this.rootDb__.create(fileStoreRef.id, stat);
    this.cacheReferences__[fileStoreRef.id] = fileStoreRef;

    // fileStoreRef.save();
    this.storeChanged__(fileStoreRef);
  }

  // TODO: defineDocument and defineCollection

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
  async doc<TDoc extends Dictionary<unknown>>(id: string | StoreFileId): Promise<DocumentReference<TDoc>> {
    if (typeof id !== 'string') id = getStoreId(id);
    logger.logMethodArgs?.('doc', id);

    if (Object.hasOwn(this.cacheReferences__, id)) {
      const ref = this.cacheReferences__[id];
      if (!(ref instanceof DocumentReference)) {
        logger.accident('doc', 'document_wrong_type', id);
        throw new Error('document_wrong_type', {cause: id});
      }
      return this.cacheReferences__[id] as unknown as DocumentReference<TDoc>;
    }

    if (!this.rootDb__.exists(id)) {
      logger.accident('doc', 'document_not_found', id);
      throw new Error('document_not_found', {cause: id});
    }

    const storeStat = this.rootDb__.get(id);

    if (storeStat.type != StoreFileType.Document) {
      logger.accident('doc', 'document_wrong_type', id);
      throw new Error('document_wrong_type', {cause: id});
    }

    const context = await this.readContext__<DocumentContext<TDoc>>(storeStat);
    const docRef = DocumentReference.newRefFromContext(context, this.storeChanged__.bind(this));
    this.cacheReferences__[id] = docRef as unknown as DocumentReference;
    return docRef;
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
  async collection<TItem extends Dictionary<unknown>>(id: string | StoreFileId): Promise<CollectionReference<TItem>> {
    if (typeof id !== 'string') id = getStoreId(id);
    logger.logMethodArgs?.('collection', id);

    if (Object.hasOwn(this.cacheReferences__, id)) {
      const ref = this.cacheReferences__[id];
      if (!(ref instanceof CollectionReference)) {
        logger.accident('collection', 'collection_wrong_type', id);
        throw new Error('collection_wrong_type', {cause: id});
      }
      return this.cacheReferences__[id] as unknown as CollectionReference<TItem>;
    }

    if (!this.rootDb__.exists(id)) {
      logger.accident('collection', 'collection_not_found', id);
      throw new Error('collection_not_found', {cause: id});
    }

    const storeStat = this.rootDb__.get(id);

    if (storeStat.type != StoreFileType.Collection) {
      logger.accident('doc', 'collection_wrong_type', id);
      throw new Error('collection_not_found', {cause: id});
    }

    const context = await this.readContext__<CollectionContext<TItem>>(storeStat);
    const colRef = CollectionReference.newRefFromContext(context, this.storeChanged__.bind(this));
    this.cacheReferences__[id] = colRef as unknown as DocumentReference;
    return colRef;
  }

  /**
   * Unloads the store file with the given id from memory.
   *
   * @param id The unique identifier of the store file.
   * @example
   * ```typescript
   * alwatrStore.unload({name: 'user-list', region: Region.Secret});
   * alwatrStore.exists({name: 'user-list', region: Region.Secret}); // true
   * ```
   */
  unload(id: string | StoreFileId): void {
    if (typeof id !== 'string') id = getStoreId(id);
    logger.logMethodArgs?.('unload', id);
    // TODO: this.save_(id);
    delete this.cacheReferences__[id];
  }

  /**
   * Deletes a file from the store.
   *
   * You don't need to await this method to complete unless you want to make sure the file is deleted on disk.
   *
   * @param id The ID of the file to delete.
   * @returns A Promise that resolves when the file is deleted.
   * @example
   * ```typescript
   * alwatrStore.deleteFile({name: 'user-list', region: Region.Secret});
   * alwatrStore.exists({name: 'user-list', region: Region.Secret}); // true
   * ```
   */
  async deleteFile(id: string | StoreFileId): Promise<void> {
    if (typeof id !== 'string') id = getStoreId(id);
    logger.logMethodArgs?.('deleteFile', id);
    if (!this.rootDb__.exists(id)) {
      logger.accident('doc', 'document_not_found', id);
      throw new Error('document_not_found', {cause: id});
    }
    delete this.cacheReferences__[id]; // direct unload to prevent save
    const path = getStorePath(this.rootDb__.get(id));
    this.rootDb__.delete(id);
    await waitForTimeout(0);
    try {
      await unlink(resolve(this.config__.rootPath, path));
    }
    catch (error) {
      logger.error('deleteFile', 'delete_file_failed', {id, path, error});
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
      if (ref.hasUnprocessedChanges_ === true) {
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
    const context = (await readJsonFile(resolve(this.config__.rootPath, path))) as T;
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
    await writeJsonFile(resolve(this.config__.rootPath, path), context, WriteFileMode.Rename);
    logger.timeEnd?.(`writeContext__time(${path})`);
  }

  /**
   * Write store file context.
   *
   * @param id The unique identifier of the store file.
   * @param context The store file context. If not provided, it will be loaded from memory.
   * @param sync If true, the file will be written synchronously.
   */
  protected async storeChanged__<T extends Dictionary<unknown>>(from: DocumentReference<T> | CollectionReference<T>): Promise<void> {
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
      logger.banner('Initialize new alwatr-store');
      return CollectionReference.newRefFromData(AlwatrStore.rootDbStat__, null, this.storeChanged__.bind(this));
    }
    // else
    const context = readJsonFile(fullPath, true) as CollectionContext<StoreFileStat>;
    return CollectionReference.newRefFromContext(context, this.storeChanged__.bind(this), 'root-db');
  }

  /**
   * Save all store files.
   */
  private exitHook__(): void {
    logger.logMethod?.('exitHook__');
    for (const ref of Object.values(this.cacheReferences__)) {
      logger.logProperty?.(`StoreFile.${ref.id}.hasUnprocessedChanges`, ref.hasUnprocessedChanges_);
      if (ref.hasUnprocessedChanges_ === true) {
        logger.incident?.('exitHook__', 'rescue_unsaved_context', {id: ref.id});
        writeJsonFile(resolve(this.config__.rootPath, ref.path), ref.getFullContext_(), WriteFileMode.Rename, true);
        ref.hasUnprocessedChanges_ = false;
      }
    }
  }
}
