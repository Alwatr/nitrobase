import {DocumentReference} from './lib/document-reference.js';
import {logger} from './lib/logger.js';
import {
  StoreFileType,
  StoreFileEncoding,
  Region,
  type StoreFileStat,
  type DocumentContext,
  type AlwatrStoreConfig,
  type StoreFileContext,
} from './lib/type.js';

export class AlwatrStore {
  /**
   * Alwatr store engine major version number.
   */
  static readonly version = 5;

  /**
   * Create a new document context.
   */
  protected static newDocumentContext_<TDoc extends Record<string, unknown>>(
    id: string,
    region: Region,
    data: TDoc,
  ): DocumentContext<TDoc> {
    const now = Date.now();
    return {
      ok: true,
      meta: {
        id,
        region,
        rev: 1,
        updated: now,
        created: now,
        type: StoreFileType.document,
        encoding: StoreFileEncoding.json,
        version: AlwatrStore.version,
      },
      data,
    };
  }

  protected static async readStoreFile_<TData extends Record<string, unknown>>(
    stat: StoreFileStat,
  ): Promise<StoreFileContext<TData>> {
    logger.logMethodArgs?.('readStoreFile', stat.id);
    const context = AlwatrStore.newDocumentContext_(stat.id, stat.region, {} as TData);
    await AlwatrStore.validateStoreFile_(context);
    return context;
  }

  protected static async writeStoreFile_(
    stat: StoreFileStat,
    context: StoreFileContext<Record<string, unknown>>,
  ): Promise<void> {
    logger.logMethodArgs?.('writeStoreFile', stat.id);
    logger.logProperty?.('context', context); // tmp
  }

  protected static async validateStoreFile_(context: StoreFileContext<Record<string, unknown>>): Promise<void> {
    logger.logMethodArgs?.('_validateStoreFile', {id: context.meta});

    if (context.ok !== true) {
      throw new Error('store_not_ok', {cause: context});
    }

    if (context.meta.version < AlwatrStore.version) {
      logger.accident?.('_validateStoreFile', 'store_version_incompatible', {
        fileVersion: context.meta.version,
        currentVersion: AlwatrStore.version,
      });
      await AlwatrStore.migrateStoreFile_(context);
    }

    if (context.meta.version !== AlwatrStore.version) {
      throw new Error('store_version_incompatible', {cause: {meta: context.meta}});
    }
  }

  protected static async migrateStoreFile_(context: StoreFileContext<Record<string, unknown>>): Promise<void> {
    logger.logMethodArgs?.('_migrateStoreFile', {id: context.meta, version: context.meta.version});
    // if(context.meta.version === 4) {})
  }

  /**
   * `collectionReference` of all `storeFileStat`s.
   */
  protected storeFilesCollection_;

  /**
   * Keep all loaded store file context loaded in memory.
   */
  protected memoryContextRecord_: Record<string, StoreFileContext> = {};

  constructor(readonly config: AlwatrStoreConfig) {
    logger.logMethodArgs?.('new', config);
    this.storeFilesCollection_ = this.loadRootStoreDocument_();
  }

  /**
   * Load storeFilesCollection or create new one.
   */
  protected loadRootStoreDocument_(): DocumentReference<Record<string, StoreFileStat>> {
    // TODO: load root meta or make empty and save
    const context = AlwatrStore.newDocumentContext_<Record<string, StoreFileStat>>('.store-files', Region.Secret, {});
    return new DocumentReference(context, this.rootStoreUpdated_.bind(this));
  }

  /**
   * On storeFilesCollection has been updated.
   */
  protected rootStoreUpdated_() {
    logger.logMethod?.('rootStoreUpdated');
    // TODO: save
  }

  /**
   * Add new store file to the storeFilesCollection.
   */
  protected addStoreFile_(stat: StoreFileStat) {
    logger.logMethodArgs?.('_addStoreFile', stat);
    this.storeFilesCollection_.update({[stat.id]: stat});
  }

  exists(id: string): boolean {
    logger.logMethodArgs?.('exist', id);
    return id in this.storeFilesCollection_.get();
  }

  stat(id: string): Readonly<StoreFileStat> {
    logger.logMethodArgs?.('stat', id);
    // TODO: error store_file_not_defined
    return this.storeFilesCollection_.get()[id] ?? null;
  }

  defineDoc<TDoc extends Record<string, unknown>>(
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
    return AlwatrStore.writeStoreFile_(stat, AlwatrStore.newDocumentContext_(config.id, config.region, initialData));
  }

  async doc<TDoc extends Record<string, unknown>>(id: string) {
    logger.logMethodArgs?.('getDocument', id);

    const stat = this.stat(id);
    if (stat == null) throw new Error('document_not_found', {cause: {id}});
    if (stat.type != StoreFileType.document) {
      logger.error?.('getDocument', 'document_wrong_type', stat);
      throw new Error('document_not_found', {cause: stat});
    }
    const context = this.memoryContextRecord_[id] = await AlwatrStore.readStoreFile_<TDoc>(stat);
    return new DocumentReference(context, this.save_.bind(this));
  }

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

  unload(id: string): void {
    logger.logMethodArgs?.('unload', id);
    // TODO: this.save_(id);
    delete this.memoryContextRecord_[id];
  }

  deleteFile(id: string): void {
    logger.logMethodArgs?.('deleteFile', id);
    if (id in this.memoryContextRecord_) {
      this.unload(id);
    }
    // TODO: AlwatrStore.deleteStoreFile_(this.stat(id));
    delete this.storeFilesCollection_.get()[id];
  }
}
