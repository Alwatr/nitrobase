import {createLogger} from '@alwatr/logger';

import {logger} from './logger.js';

import type {
  CollectionContext,
  CollectionItem,
  CollectionItemMeta,
  StoreFileMeta,
  StoreFileContext,
  StoreFileId,
  StoreFileAddress,
} from '../type.js';

logger.logModule?.('collection-reference');

export class CollectionReference<TItem extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Alwatr store engine version string.
   */
  static readonly version = __package_version;

  /**
   * Alwatr store engine file format version number.
   */
  static readonly fileFormatVersion = 1;

  /**
   * Creates a new empty collection context.
   *
   * @param id the collection address.
   * @template TItem The collection item data type.
   *
   * @returns A new collection context.
   */
  static newContext_<TItem extends Record<string, unknown>>(id: StoreFileId): CollectionContext<TItem> {
    logger.logMethodArgs?.('coll.newContext', id);
    const now = Date.now();
    return {
      ok: true,
      meta: {
        rev: 1,
        updated: now,
        created: now,
        ver: CollectionReference.version,
        fv: CollectionReference.fileFormatVersion,
        lastAutoId: 0,
        ...id.value,
      },
      data: {},
    };
  }

  /**
   * Migrate the collection context to the latest.
   *
   * @param context collection context
   */
  static migrateContext_(context: StoreFileContext<Record<string, unknown>>): void {
    logger.logMethodArgs?.('coll.migrateContext_', {meta: context.meta});

    // if (context.meta.fv === 1) migrate_to_2

    if (context.meta.fv > CollectionReference.fileFormatVersion) {
      logger.accident('coll.migrateContext_', 'store_version_incompatible', context.meta);
      throw new Error('store_version_incompatible', {cause: context.meta});
    }

    if (context.meta.ver !== CollectionReference.version) {
      context.meta.ver = CollectionReference.version;
    }
  }

  protected _logger = createLogger(`coll:${this.context_.meta.id}/${this.context_.meta.ownerId}`.slice(0, 20));

  /**
   * Collection reference have methods to get, set, update and save the Alwatr Store Collection.
   * This class is dummy in saving and loading the collection from file.
   * It's the responsibility of the Alwatr Store to save and load the collection.
   *
   * @param context_ Collection's context filled from the Alwatr Store (parent).
   * @param updatedCallback_ updated callback to invoke when the collection is updated from the Alwatr Store (parent).
   * @template TItem - Items data type.
   * @example
   * ```typescript
   * const collectionRef = alwatrStore.col('blog/posts');
   * ```
   */
  constructor(
    protected context_: CollectionContext<TItem>,
    protected updatedCallback_: (id: StoreFileAddress, context: CollectionContext<TItem>) => void,
  ) {
    this._logger.logMethodArgs?.('new', context_.meta);
  }

  /**
   * Checks if an item exists in the collection.
   *
   * @param id - The ID of the item.
   * @returns `true` if the item with the given ID exists in the collection, `false` otherwise.
   *
   * @example
   * ```typescript
   * const doesExist = collectionRef.exists('item1');
   *
   * if (doesExist) {
   *    collectionRef.create('item1', { key: 'value' });
   * }
   * ```
   */
  exists(id: string | number): boolean {
    const exists = id in this.context_.data;
    this._logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  /**
   * Retrieves the metadata of the store file.
   *
   * @returns The metadata of the store file.
   *
   * @example
   * ```typescript
   * const metadata = collectionRef.stat();
   * ```
   */
  stat(): Readonly<StoreFileMeta> {
    this._logger.logMethodFull?.('meta', undefined, this.context_.meta);
    return this.context_.meta;
  }

  /**
   * Retrieves an item from the collection. If the item does not exist, an error is thrown.
   *
   * @param id - The ID of the item.
   * @returns The item with the given ID.
   */
  protected item_(id: string | number): CollectionItem<TItem> {
    const item = this.context_.data[id];
    if (item === undefined) {
      this._logger.accident('item_', 'collection_item_not_found', {id});
      throw new Error('collection_item_not_found', {cause: {id}});
    }
    return item;
  }

  /**
   * Retrieves an item's metadata from the collection. If the item does not exist, an error is thrown.
   *
   * @param id - The ID of the item.
   * @returns The metadata of the item with the given ID.
   */
  meta(id: string | number): Readonly<CollectionItemMeta> {
    this._logger.logMethodFull?.('meta', id, this.context_.meta);
    return this.item_(id).meta;
  }

  /**
   * Retrieves an item's data from the collection. If the item does not exist, an error is thrown.
   *
   * @param id - The ID of the item.
   * @returns The data of the item with the given ID.
   *
   * @example
   * ```typescript
   * const itemData = collectionRef.get('item1');
   * ```
   */
  get(id: string | number): TItem {
    this._logger.logMethodArgs?.('get', id);
    return this.item_(id).data;
  }

  /**
   * Creates a new item in the collection. If an item with the given ID already exists, an error is thrown.
   *
   * @param id - The ID of the item to create.
   * @param data - The initial data of the item.
   *
   * @example
   * ```typescript
   * collectionRef.create('item1', { key: 'value' });
   * ```
   */
  create(id: string | number, data: TItem): void {
    this._logger.logMethodArgs?.('create', {id, data});
    if (this.exists(id)) {
      this._logger.accident('create', `collection_item_exist`, {id});
      throw new Error(`collection_item_exist`, {cause: {id}});
    }
    this.context_.data[id] = {
      meta: {
        id,
        rev: 0,
        created: 0, // calc in _updated
        updated: 0,
      },
      data,
    };
    this.updated_(id);
  }

  append(data: TItem): string | number {
    this._logger.logMethodArgs?.('append', data);
    const id = this.nextAutoIncrementId_();
    this.create(id, data);
    return id;
  }

  /**
   * Deletes an item from the collection.
   *
   * @param id - The ID of the item to delete.
   *
   * @example
   * ```typescript
   * collectionRef.delete('item1');
   * ```
   */
  delete(id: string | number): void {
    this._logger.logMethodArgs?.('delete', id);
    delete this.context_.data[id];
    this.updated_();
  }

  /**
   * Sets an item's data in the collection. Replaces the item's data with the given data.
   *
   * @param id - The ID of the item to set.
   * @param data - The data to set for the item.
   *
   * @example
   * ```typescript
   * collectionRef.set('item1', { key: 'new value' });
   * ```
   */
  set(id: string | number, data: TItem): void {
    this._logger.logMethodArgs?.('set', {id, data});
    this.item_(id).data = data;
    this.updated_(id);
  }

  /**
   * Updates an item in the collection. Can be used to update a part of the item.
   *
   * @param id - The ID of the item to update.
   * @param data - The data to update for the item.
   *
   * @example
   * ```typescript
   * collectionRef.update('item1', { key: 'updated value' });
   * ```
   */
  update(id: string | number, data: Partial<TItem>): void {
    this._logger.logMethodArgs?.('update', data);
    Object.assign(this.item_(id).data, data);
    this.updated_(id);
  }

  /**
   * Requests the Alwatr Store to save the collection.
   * Saving may take some time in Alwatr Store due to the use of throttling.
   *
   * @param id - The ID of the item to save.
   *
   * @example
   * ```typescript
   * collectionRef.save('item1');
   * ```
   */
  save(id: string | number): void {
    this._logger.logMethodArgs?.('save', id);
    this.updated_(id);
  }

  /**
   * Retrieves the IDs of all items in the collection in array.
   * Impact performance if the collection is large, use `ids()` instead.
   *
   * @returns Array of IDs of all items in the collection.
   * @example
   * ```typescript
   * const ids = collectionRef.keys();
   * ```
   */
  keys(): string[] {
    return Object.keys(this.context_.data);
  }

  /**
   * Retrieves all items in the collection in array.
   * Impact performance if the collection is large, use `items()` instead.
   *
   * @returns Array of all items in the collection.
   * @example
   * ```typescript
   * const items = collectionRef.values();
   * console.log('meta: %o', items[0].meta);
   * console.log('data: %o', items[0].data);
   * ```
   */
  values(): CollectionItem<TItem>[] {
    return Object.values(this.context_.data);
  }

  /**
   * Retrieves the IDs of all items in the collection.
   * Use this method instead of `keys()` if the collection is large.
   * This method is a generator and can be used in `for...of` loops.
   * @returns Generator of IDs of all items in the collection.
   * @example
   * ```typescript
   * for (const id of collectionRef.ids()) {
   *   const doc = collectionRef.get(id);
   * }
   * ```
   */
  *ids(): Generator<string, void, void> {
    for (const id in this.context_.data) {
      yield id;
    }
  }

  /**
   * Retrieves all items in the collection.
   * Use this method instead of `values()` if the collection is large.
   * This method is a generator and can be used in `for...of` loops.
   * @returns Generator of all items in the collection.
   * @example
   * ```typescript
   * for (const item of collectionRef.items()) {
   *  console.log(item.data);
   * }
   */
  *items(): Generator<CollectionItem<TItem>, void, void> {
    for (const id in this.context_.data) {
      yield this.context_.data[id];
    }
  }

  /**
   * Updates the collection's metadata.
   *
   * @param id - The ID of the item to update.
   */
  protected updateMeta_(id?: string | number): void {
    this._logger.logMethod?.('_updateMeta');
    const now = Date.now();
    this.context_.meta.rev++;
    this.context_.meta.updated = now;
    if (id !== undefined) {
      const itemMeta = this.item_(id).meta;
      itemMeta.rev++;
      itemMeta.updated = now;
    }
  }

  /**
   * Updates the collection's metadata and invokes the updated callback.
   *
   * @param id - The ID of the item to update.
   */
  protected updated_(id?: string | number): void {
    this._logger.logMethod?.('_updated');
    this.updateMeta_(id);
    this.updatedCallback_(this.context_.meta, this.context_);
  }

  /**
   * Generates the next auto increment ID.
   *
   * @returns The next auto increment ID.
   * @example
   * ```typescript
   * const nextId = this.nextAutoIncrementId_();
   * ```
   */
  protected nextAutoIncrementId_(): number {
    do {
      this.context_.meta.lastAutoId!++;
    } while (this.context_.meta.lastAutoId! in this.context_.data);
    return this.context_.meta.lastAutoId!;
  }
}
