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
} from './lib/type.js';

logger.logModule?.('alwatr-store');

export class AlwatrStore {
  /**
   * Alwatr store engine version string.
   */
  static readonly version = __package_version;

  protected static async readStoreFile_<TData extends Record<string, unknown>>(
    stat: StoreFileStat,
  ): Promise<StoreFileContext<TData>> {
    logger.logMethodArgs?.('readStoreFile', stat.id);
    const context = DocumentReference.newContext_(stat.id, stat.region, {} as TData);
    AlwatrStore.validateStoreFile_(context);
    return context;
  }

  protected static async writeStoreFile_(
    stat: StoreFileStat,
    context: StoreFileContext<Record<string, unknown>>,
  ): Promise<void> {
    logger.logMethodArgs?.('writeStoreFile', stat.id);
    logger.logProperty?.('context', context); // tmp
  }

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
    const context = DocumentReference.newContext_<Record<string, StoreFileStat>>('.store-files', Region.Secret, {});
    return new DocumentReference(context, this.rootStoreUpdated_.bind(this));
  }

  /**
   * On storeFilesCollection has been updated.
   */
  protected rootStoreUpdated_() {
    logger.logMethod?.('rootStoreUpdated_');
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
    const exists = id in this.storeFilesCollection_.get();
    logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  stat(id: string): Readonly<StoreFileStat> {
    const stat = this.storeFilesCollection_.get()[id] ?? null;
    logger.logMethodFull?.('stat', id, stat);
    // TODO: error store_file_not_defined
    return stat;
  }

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
