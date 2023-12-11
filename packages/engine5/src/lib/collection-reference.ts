import {createLogger} from '@alwatr/logger';

import {logger} from './logger.js';

import type {CollectionContext, CollectionItem, CollectionItemMeta, StoreFileMeta} from './type.js';

logger.logModule?.('collection-reference');

/**
 * Collection reference have methods to get, set, update and save the Alwatr Store Collection.
 * This class is dummy in saving and loading the collection from file.
 * It's the responsibility of the Alwatr Store to save and load the collection.
 *
 * @template TItem - Items data type.
 */
export class CollectionReference<TItem extends Record<string, unknown> = Record<string, unknown>> {
  protected _logger = createLogger(`coll:${this.context_.meta.id.slice(0, 20)}`);

  /**
   * @param context_ Collection's context filled from the Alwatr Store (parent).
   * @param updatedCallback_ updated callback to invoke when the collection is updated from the Alwatr Store (parent).
   */
  constructor(
    protected context_: CollectionContext<TItem>,
    protected updatedCallback_: (id: string) => void,
  ) {
    this._logger.logMethodArgs?.('new', context_.meta.id);
  }

  /**
   * Check Collection's item existence.
   *
   * @param id - The ID of the item.
   * @returns Whether the item with the given ID exists in the collection.
   */
  exists(id: string): boolean {
    const exists = id in this.context_.data;
    this._logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  /**
   * Get Collection's metadata.
   *
   * @returns The metadata of the store file.
   */
  stat(): Readonly<StoreFileMeta> {
    this._logger.logMethodFull?.('meta', undefined, this.context_.meta);
    return this.context_.meta;
  }

  /**
   * Get Collection's item, if not exists throw an error.
   *
   * @param id - The ID of the item.
   * @returns The item with the given ID.
   */
  protected item_(id: string): CollectionItem<TItem> {
    const item = this.context_.data[id];
    if (item === undefined) throw new Error(`collection_item_not_found`, {cause: {id}});
    return item;
  }

  /**
   * Get Collection's item metadata, if not exists throw an error.
   *
   * @param id - The ID of the item.
   * @returns The metadata of the item with the given ID.
   */
  meta(id: string): Readonly<CollectionItemMeta> {
    this._logger.logMethodFull?.('meta', id, this.context_.meta);
    return this.item_(id).meta;
  }

  /**
   * Get Collection's item data, if not exists throw an error.
   *
   * @param id - The ID of the item.
   * @returns The data of the item with the given ID.
   */
  get(id: string): TItem {
    this._logger.logMethodArgs?.('get', id);
    return this.item_(id).data;
  }

  /**
   * Create a new item in the collection.
   * If an item with the given ID already exists, an error will be thrown.
   *
   * @param id - The ID of the item to create.
   * @param initialData - The initial data of the item.
   */
  create(id: string, initialData: TItem): void {
    this._logger.logMethodArgs?.('create', {id, initialData});
    if (id in this.context_.data) throw new Error(`collection_item_exist`, {cause: {id}});
    this.context_.data[id] = {
      meta: {
        id,
        rev: 0,
        created: 0, // calc in _updated
        updated: 0,
      },
      data: initialData,
    };
    this.updated_(id);
  }

  /**
   * Delete an item from the collection.
   *
   * @param id - The ID of the item to delete.
   */
  delete(id: string): void {
    this._logger.logMethodArgs?.('delete', id);
    delete this.context_.data[id];
    this.updated_();
  }

  /**
   * Set an item's data in the collection.
   * Replaces the item's data with the given data.
   *
   * @param id - The ID of the item to set.
   * @param data - The data to set for the item.
   */
  set(id: string, data: TItem): void {
    this._logger.logMethodArgs?.('set', {id, data});
    this.item_(id).data = data;
    this.updated_(id);
  }

  /**
   * Update an item in the collection.
   * Can be used to update a part of the item.
   *
   * @param id - The ID of the item to update.
   * @param data - The data to update for the item.
   */
  update(id: string, data: Partial<TItem>): void {
    this._logger.logMethodArgs?.('update', data);
    Object.assign(this.item_(id).data, data);
    this.updated_(id);
  }

  /**
   * Request the Alwatr Store to save the collection.
   *
   * Saving may take some time in Alwatr Store due to the use of throttling.
   *
   * @param id - The ID of the item to save.
   */
  save(id: string): void {
    this._logger.logMethodArgs?.('save', id);
    this.updated_(id);
  }

  /**
   * Update the collection's metadata.
   *
   * @param id - The ID of the item to update.
   */
  protected updateMeta_(id?: string): void {
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
   * Notify the Alwatr Store (parent) that the collection is updated.
   *
   * Alwatr Store save the collection to the storage based the throttling.
   *
   * @param id - The ID of the item to update.
   */
  protected updated_(id?: string): void {
    this._logger.logMethod?.('_updated');
    this.updateMeta_(id);
    this.updatedCallback_(this.context_.meta.id);
  }
}
