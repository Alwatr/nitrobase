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
import {Dictionary} from '@alwatr/type-helper';

import {logger} from './logger';
import {getStoreId, getStorePath} from './util.ts';

logger.logModule?.('collection-reference');

/**
 * Represents a reference to a collection of the AlwatrStore.
 * Provides methods to interact with the collection, such as retrieving, creating, updating, and deleting items.
 *
 * @template TItem - The data type of the collection items.
 */
export class CollectionReference<TItem extends Dictionary = Dictionary> {
  /**
   * Alwatr store engine version string.
   */
  static readonly version = __package_version;

  /**
   * Alwatr store engine file format version number.
   */
  static readonly fileFormatVersion = 1;

  /**
   * Creates new CollectionReference instance from stat.
   *
   * @param stat the collection stat.
   * @param initialData the collection data.
   * @param updatedCallback the callback to invoke when the collection changed.
   * @template TItem The collection item data type.
   * @returns A new collection reference class.
   */
  static newRefFromData<TItem extends Dictionary>(
    stat: StoreFileId,
    initialData: CollectionContext<TItem>['data'] | null,
    updatedCallback: (from: CollectionReference<TItem>) => void,
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
      },
      data: initialData ?? {},
    };

    return new CollectionReference(initialContext, updatedCallback);
  }

  /**
   * Creates new CollectionReference instance from CollectionContext.
   *
   * @param context the collection context.
   * @param updatedCallback the callback to invoke when the collection changed.
   * @template TItem The collection item data type.
   * @returns A new collection reference class.
   */
  static newRefFromContext<TItem extends Dictionary>(
    context: CollectionContext<TItem>,
    updatedCallback: (from: CollectionReference<TItem>) => void,
  ): CollectionReference<TItem> {
    logger.logMethodArgs?.('col.newRefFromContext', context.meta);
    return new CollectionReference(context, updatedCallback);
  }

  /**
   * Validates the collection context and try to migrate it to the latest version.
   *
   * @param context collection context
   */
  private static validateContext__(context: CollectionContext<Dictionary>): void {
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
  private static migrateContext__(context: CollectionContext<Dictionary>): void {
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

    // if (context.meta.fv === 1) migrate_to_2

    context.meta.ver = CollectionReference.version;
  }

  /**
   * The ID of the collection store file.
   */
  readonly id = getStoreId(this.context__.meta);

  /**
   * The location path of the collection store file.
   */
  readonly path = getStorePath(this.context__.meta);

  /**
   * Logger instance for this collection.
   */
  private logger__ = createLogger(`col:${this.id.slice(0, 20)}`);

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
  ) {
    this.logger__.logMethodArgs?.('new', {path: this.path});
    CollectionReference.validateContext__(this.context__);
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
    const exists = Object.hasOwn(this.context__.data, id);
    this.logger__.logMethodFull?.('exists', id, exists);
    return exists;
  }

  /**
   * Retrieves the metadata of the store file.
   *
   * @returns The metadata of the store file.
   *
   * @example
   * ```typescript
   * const metadata = collectionRef.meta();
   * ```
   */
  meta(): Readonly<StoreFileMeta> {
    this.logger__.logMethodFull?.('meta', undefined, this.context__.meta);
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
   * @param id - The ID of the item.
   * @returns The metadata of the item with the given ID.
   */
  metaItem(id: string | number): Readonly<CollectionItemMeta> {
    const meta = this.item__(id).meta;
    this.logger__.logMethodFull?.('meta', id, meta);
    return meta;
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
    this.logger__.logMethodArgs?.('get', id);
    return this.item__(id).data;
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
    this.context__.data[id] = {
      meta: {
        id,
        // other prop calc in updateMeta__
        rev: 0,
        created: 0,
        updated: 0,
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
    this.updated__();
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
    this.logger__.logMethodArgs?.('update', data);
    Object.assign(this.item__(id).data, data);
    this.updated__(id);
  }

  /**
   * Requests the Alwatr Store to save the collection.
   * Saving may take some time in Alwatr Store due to the use of throttling.
   *
   * @param id - The ID of the item to update the metadata.
   *
   * @example
   * ```typescript
   * collectionRef.save('item1');
   * ```
   */
  save(id?: string | number): void {
    this.logger__.logMethodArgs?.('save', id);
    this.updated__(id);
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
    for (const id in this.context__.data) {
      yield this.context__.data[id];
    }
  }

  getFullContext_(): Readonly<CollectionContext<TItem>> {
    this.logger__.logMethod?.('getFullContext_');
    return this.context__;
  }

  private updateDelayed__ = false;

  /**
   * Update the document metadata and invoke the updated callback.
   * This method is throttled to prevent multiple updates in a short time.
   *
   * @param id - The ID of the item to update.
   */
  private async updated__(id?: string | number): Promise<void> {
    this.logger__.logMethodArgs?.('updated__', {delayed: this.updateDelayed__});
    this.updateMeta__(id);
    if (this.updateDelayed__) return;
    // else
    this.updateDelayed__ = true;
    await new Promise((resolve) => setImmediate(resolve));
    this.updateDelayed__ = false;
    this.updatedCallback__.call(null, this);
  }

  /**
   * Updates the collection's metadata.
   *
   * @param id - The ID of the item to update.
   */
  private updateMeta__(id?: string | number): void {
    this.logger__.logMethod?.('updateMeta__');
    const now = Date.now();
    this.context__.meta.rev++;
    this.context__.meta.updated = now;
    if (id !== undefined) {
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
    const meta = this.context__.meta as Required<StoreFileMeta>;
    do {
      meta.lastAutoId++;
    } while (meta.lastAutoId in this.context__.data);
    return meta.lastAutoId;
  }
}
