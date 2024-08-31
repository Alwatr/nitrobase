import {createLogger} from '@alwatr/logger';
import {
  StoreFileType,
  StoreFileExtension,
  type StoreFileId,
  type CollectionContext,
  type CollectionItem,
  type CollectionItemMeta,
  type StoreFileMeta,
} from '@alwatr/store-types';
import {waitForImmediate, waitForTimeout} from '@alwatr/wait';

import {logger} from './logger.js';
import {getStoreId, getStorePath} from './util.js';

import type {JsonifiableObject} from '@alwatr/type-helper';

logger.logModule?.('collection-reference');

/**
 * Represents a reference to a collection of the AlwatrStore.
 * Provides methods to interact with the collection, such as retrieving, creating, updating, and deleting items.
 *
 * @template TItem - The data type of the collection items.
 */
export class CollectionReference<TItem extends JsonifiableObject = JsonifiableObject> {
  /**
   * Alwatr store engine version string.
   */
  static readonly version = __package_version__;

  /**
   * Alwatr store engine file format version number.
   */
  static readonly fileFormatVersion = 2;

  /**
   * Creates new CollectionReference instance from stat.
   *
   * @param stat the collection stat.
   * @param initialData the collection data.
   * @param updatedCallback the callback to invoke when the collection changed.
   * @template TItem The collection item data type.
   * @returns A new collection reference class.
   */
  static newRefFromData<TItem extends JsonifiableObject>(
    stat: StoreFileId,
    initialData: CollectionContext<TItem>['data'] | null,
    updatedCallback: (from: CollectionReference<TItem>) => void,
    debugDomain?: string,
  ): CollectionReference<TItem> {
    logger.logMethodArgs?.('col.newRefFromData', stat);

    const now = Date.now();
    const initialContext: CollectionContext<TItem> = {
      ok: true,
      meta: {
        ...stat,
        rev: 1,
        updated: now,
        created: now,
        lastAutoId: 0,
        type: StoreFileType.Collection,
        extension: StoreFileExtension.Json,
        ver: CollectionReference.version,
        fv: CollectionReference.fileFormatVersion,
        schemaVer: 1
      },
      data: initialData ?? {},
    };

    return new CollectionReference(initialContext, updatedCallback, debugDomain);
  }

  /**
   * Creates new CollectionReference instance from CollectionContext.
   *
   * @param context the collection context.
   * @param updatedCallback the callback to invoke when the collection changed.
   * @template TItem The collection item data type.
   * @returns A new collection reference class.
   */
  static newRefFromContext<TItem extends JsonifiableObject>(
    context: CollectionContext<TItem>,
    updatedCallback: (from: CollectionReference<TItem>) => void,
    debugDomain?: string,
  ): CollectionReference<TItem> {
    logger.logMethodArgs?.('col.newRefFromContext', context.meta);
    return new CollectionReference(context, updatedCallback, debugDomain);
  }

  /**
   * Validates the collection context and try to migrate it to the latest version.
   *
   * @param context collection context
   */
  private static validateContext__(context: CollectionContext<JsonifiableObject>): void {
    logger.logMethodArgs?.('col.validateContext__', {name: context.meta?.name});

    if (context.ok !== true) {
      logger.accident?.('col.validateContext__', 'store_not_ok', context);
      throw new Error('store_not_ok', {cause: context});
    }

    if (context.meta === undefined) {
      logger.accident?.('col.validateContext__', 'store_meta_undefined', context);
      throw new Error('store_meta_undefined', {cause: context});
    }

    if (context.meta.type !== StoreFileType.Collection) {
      logger.accident?.('col.validateContext__', 'collection_type_invalid', context.meta);
      throw new Error('collection_type_invalid', {cause: context.meta});
    }

    if (context.meta.ver !== CollectionReference.version) {
      logger.incident?.('col.validateContext__', 'store_version_incompatible', {
        fileVersion: context.meta.ver,
        currentVersion: CollectionReference.version,
      });

      CollectionReference.migrateContext__(context);
    }
  }

  /**
   * Migrate the collection context to the latest.
   *
   * @param context collection context
   */
  private static migrateContext__(context: CollectionContext<JsonifiableObject>): void {
    if (context.meta.ver === CollectionReference.version) return;

    logger.logMethodArgs?.('coll.migrateContext__', {
      name: context.meta.name,
      ver: context.meta.ver,
      fv: context.meta.fv,
    });

    if (context.meta.fv > CollectionReference.fileFormatVersion) {
      logger.accident('coll.migrateContext__', 'store_version_incompatible', context.meta);
      throw new Error('store_version_incompatible', {cause: context.meta});
    }

    if (context.meta.fv === 1) {
      // migrate from v1 to v2
      context.meta.schemaVer = 0;
      context.meta.fv = 2;
    }

    context.meta.ver = CollectionReference.version;
  }

  /**
   * The ID of the collection store file.
   */
  readonly id: string;

  /**
   * The location path of the collection store file.
   */
  readonly path: string;

  /**
   * Indicates whether the collection has unsaved changes.
   */
  hasUnprocessedChanges_ = false;

  /**
   * Logger instance for this collection.
   */
  private logger__;

  /**
   * Collection reference have methods to get, set, update and save the Alwatr Store Collection.
   * This class is dummy in saving and loading the collection from file.
   * It's the responsibility of the Alwatr Store to save and load the collection.
   *
   * @param context__ Collection's context filled from the Alwatr Store (parent).
   * @param updatedCallback__ updated callback to invoke when the collection is updated from the Alwatr Store (parent).
   * @template TItem - Items data type.
   * @example
   * ```typescript
   * const collectionRef = alwatrStore.col('blog/posts');
   * ```
   */
  constructor(
    private context__: CollectionContext<TItem>,
    private updatedCallback__: (from: CollectionReference<TItem>) => void,
    debugDomain?: string,
  ) {
    CollectionReference.validateContext__(this.context__);

    this.id = getStoreId(this.context__.meta);
    this.path = getStorePath(this.context__.meta);

    debugDomain ??= this.id.slice(0, 20);
    this.logger__ = createLogger(`col:${debugDomain}`);

    this.logger__.logMethodArgs?.('new', {id: this.id});
  }

  /**
   * Get store schema version
   *
   * @returns store schema version
   */
  get schemaVer(): number {
    return this.context__.meta.schemaVer;
  }

  /**
   * Set store schema version for migrate
   */
  set schemaVer(ver: number) {
    this.logger__.logMethodArgs?.('set schemaVer', {old: this.context__.meta.schemaVer, new: ver});
    this.context__.meta.schemaVer = ver;
    this.save();
  }


  /**
   * Indicates whether the collection data is frozen and cannot be saved.
   */
  private _freeze = false;

  /**
   * Gets the freeze status of the collection data.
   *
   * @returns `true` if the collection data is frozen, `false` otherwise.
   *
   * @example
   * ```typescript
   * const isFrozen = collectionRef.freeze;
   * console.log(isFrozen); // Output: false
   * ```
   */
  get freeze(): boolean {
    return this._freeze;
  }

  /**
   * Sets the freeze status of the collection data.
   *
   * @param value - The freeze status to set.
   *
   * @example
   * ```typescript
   * collectionRef.freeze = true;
   * console.log(collectionRef.freeze); // Output: true
   * ```
   */
  set freeze(value: boolean) {
    this.logger__.logMethodArgs?.('freeze changed', { value });
    this._freeze = value;
  }

  /**
   * Checks if an item exists in the collection.
   *
   * @param itemId - The ID of the item.
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
  exists(itemId: string | number): boolean {
    const exists = Object.hasOwn(this.context__.data, itemId);
    this.logger__.logMethodFull?.('exists', itemId, exists);
    return exists;
  }

  /**
   * Retrieves the metadata of the store file.
   *
   * @returns The metadata of the store file.
   *
   * @example
   * ```typescript
   * const metadata = collectionRef.getStoreMetadata();
   * ```
   */
  getStoreMetadata(): Readonly<StoreFileMeta> {
    this.logger__.logMethod?.('getCollectionMetadata');
    return this.context__.meta;
  }

  /**
   * Retrieves an item from the collection. If the item does not exist, an error is thrown.
   *
   * @param id - The ID of the item.
   * @returns The item with the given ID.
   */
  private item__(id: string | number): CollectionItem<TItem> {
    const item = this.context__.data[id];
    if (item === undefined) {
      this.logger__.accident('item_', 'collection_item_not_found', {id});
      throw new Error('collection_item_not_found', {cause: {id}});
    }
    return item;
  }

  /**
   * Retrieves an item's metadata from the collection. If the item does not exist, an error is thrown.
   *
   * @param itemId - The ID of the item.
   * @returns The metadata of the item with the given ID.
   * @example
   * ```typescript
   * const itemMeta = collectionRef.getItemMetadata('item1');
   * ```
   */
  getItemMetadata(itemId: string | number): Readonly<CollectionItemMeta> {
    const meta = this.item__(itemId).meta;
    this.logger__.logMethodFull?.('getItemMetadata', itemId, meta);
    return meta;
  }

  /**
   * Retrieves an item's data from the collection. If the item does not exist, an error is thrown.
   *
   * @param itemId - The ID of the item.
   * @returns The data of the item with the given ID.
   *
   * @example
   * ```typescript
   * const itemData = collectionRef.getItem('item1');
   * ```
   */
  getItem(itemId: string | number): TItem {
    this.logger__.logMethodArgs?.('get', itemId);
    return this.item__(itemId).data;
  }

  /**
   * Direct access to an item.
   * If the item does not exist, `undefined` is returned.
   * **USE WITH CAUTION!**
   *
   * @param id - The ID of the item.
   * @returns The data of the item with the given ID or `undefined` if the item does not exist.
   *
   * @example
   * ```typescript
   * collectionRef.access_('item1')?.data.name = 'test2';
   * ```
   */
  access_(id: string | number): CollectionItem<TItem> | undefined {
    this.logger__.logMethodArgs?.('access_', id);
    return this.context__.data[id];
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
    this.logger__.logMethodArgs?.('create', {id, data});
    if (this.exists(id)) {
      this.logger__.accident('create', 'collection_item_exist', {id});
      throw new Error('collection_item_exist', {cause: {id}});
    }

    const now = Date.now();

    this.context__.data[id] = {
      meta: {
        id,
        // other prop calc in updateMeta__
        rev: 0,
        created: now,
        updated: now,
      },
      data,
    };
    this.updated__(id);
  }

  /**
   * Appends the given data to the collection with auto increment ID.
   *
   * @param data - The data to append.
   * @returns The ID of the appended item.
   *
   * @example
   * ```typescript
   * const newId = collectionRef.append({ key: 'value' });
   * ```
   */
  append(data: TItem): string | number {
    this.logger__.logMethodArgs?.('append', data);
    const id = this.nextAutoIncrementId__();
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
    this.logger__.logMethodArgs?.('delete', id);
    delete this.context__.data[id];
    this.updated__(null);
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
    this.logger__.logMethodArgs?.('set', {id, data});
    (this.item__(id).data as unknown) = data;
    this.updated__(id);
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
    this.logger__.logMethodArgs?.('update', {id, data});
    Object.assign(this.item__(id).data, data);
    this.updated__(id);
  }

  /**
   * Requests the Alwatr Store to save the collection.
   * Saving may take some time in Alwatr Store due to the use of throttling.
   *
   * @example
   * ```typescript
   * collectionRef.save();
   * ```
   */
  save(): void {
    this.logger__.logMethod?.('save');
    this.updated__(null, false);
  }

  /**
   * Requests the Alwatr Store to save the collection immediately.
   *
   * @example
   * ```typescript
   * collectionRef.saveImmediate();
   * ```
   */
  saveImmediate(): void {
    this.logger__.logMethod?.('saveImmediate');
    this.updated__(null, true);
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
    this.logger__.logMethod?.('keys');
    return Object.keys(this.context__.data);
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
    this.logger__.logMethod?.('values');
    return Object.values(this.context__.data);
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
    this.logger__.logMethod?.('ids');
    for (const id in this.context__.data) {
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
    this.logger__.logMethod?.('items');
    for (const id in this.context__.data) {
      yield this.context__.data[id];
    }
  }

  /**
   * Retrieves the full context of the collection.
   *
   * @returns The full context of the collection.
   *
   * @example
   * ```typescript
   * const context = collectionRef.getFullContext_();
   * ```
   */
  getFullContext_(): Readonly<CollectionContext<TItem>> {
    this.logger__.logMethod?.('getFullContext_');
    return this.context__;
  }

  updateDelayed_ = false;

  /**
   * Update the document metadata and invoke the updated callback.
   * This method is throttled to prevent multiple updates in a short time.
   *
   * @param id - The ID of the item to update.
   */
  private async updated__(id: string | number | null, immediate = false): Promise<void> {
    this.logger__.logMethodArgs?.('updated__', {id, immediate, delayed: this.updateDelayed_});

    this.hasUnprocessedChanges_ = true;
    if (id !== null) this.updateMeta_(id); // meta must updated per item

    if (immediate === false && this.updateDelayed_ === true) return;
    // else

    this.updateDelayed_ = true;

    if (immediate === true || this.context__.meta.changeDebounce === undefined) {
      await waitForImmediate();
    }
    else {
      await waitForTimeout(this.context__.meta.changeDebounce);
    }

    if (this.updateDelayed_ !== true) return; // another parallel update finished!
    this.updateDelayed_ = false;

    if (id === null) this.updateMeta_(id); // root meta not updated for null

    if (this._freeze === true) return; // prevent save if frozen
    this.updatedCallback__.call(null, this);
  }

  /**
   * Updates the collection's metadata.
   *
   * @param id - The ID of the item to update.
   */
  updateMeta_(id: string | number | null): void {
    this.logger__.logMethodArgs?.('updateMeta__', {id});
    const now = Date.now();
    this.context__.meta.rev++;
    this.context__.meta.updated = now;
    if (id !== null) {
      const itemMeta = this.item__(id).meta;
      itemMeta.rev++;
      itemMeta.updated = now;
    }
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
  private nextAutoIncrementId__(): number {
    this.logger__.logMethod?.('nextAutoIncrementId__');
    const meta = this.context__.meta as Required<StoreFileMeta>;
    do {
      meta.lastAutoId++;
    } while (meta.lastAutoId in this.context__.data);
    return meta.lastAutoId;
  }
}
