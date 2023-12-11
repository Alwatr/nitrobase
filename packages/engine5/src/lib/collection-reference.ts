import {createLogger} from '@alwatr/logger';

import {logger} from './logger.js';

import type {CollectionContext, CollectionItem, CollectionItemMeta, StoreFileMeta} from './type.js';

logger.logModule?.('collection-reference');

export class CollectionReference<TItem extends Record<string, unknown> = Record<string, unknown>> {
  protected _logger = createLogger(`coll:${this.context_.meta.id.slice(0, 20)}`);

  constructor(
    protected context_: CollectionContext<TItem>,
    protected updatedCallback_: (id: string) => void,
  ) {
    this._logger.logMethodArgs?.('new', context_.meta.id);
  }

  exists(id: string): boolean {
    const exists = id in this.context_.data;
    this._logger.logMethodFull?.('exists', id, exists);
    return exists;
  }

  stat(): Readonly<StoreFileMeta> {
    this._logger.logMethodFull?.('meta', undefined, this.context_.meta);
    return this.context_.meta;
  }

  protected item_(id: string): CollectionItem<TItem> {
    const item = this.context_.data[id];
    if (item === undefined) throw new Error(`collection_item_not_found`, {cause: {id}});
    return item;
  }

  meta(id: string): Readonly<CollectionItemMeta> {
    this._logger.logMethodFull?.('meta', id, this.context_.meta);
    return this.item_(id).meta;
  }

  get(id: string): TItem {
    this._logger.logMethodArgs?.('get', id);
    return this.item_(id).data;
  }

  create(id: string, initialData: TItem): void {
    this._logger.logMethodArgs?.('get', {id, initialData});
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

  delete(id: string): void {
    this._logger.logMethodArgs?.('delete', id);
    delete this.context_.data[id];
    this.updated_();
  }

  set(id: string, data: TItem): void {
    this._logger.logMethodArgs?.('set', {id, data});
    this.item_(id).data = data;
    this.updated_(id);
  }

  update(id: string, data: Partial<TItem>): void {
    this._logger.logMethodArgs?.('update', data);
    Object.assign(this.item_(id).data, data);
    this.updated_(id);
  }

  save(id: string): void {
    this._logger.logMethodArgs?.('save', id);
    this.updated_(id);
  }

  protected updated_(id?: string): void {
    this._logger.logMethod?.('_updated');
    this.updateMeta_(id);
    this.updatedCallback_(this.context_.meta.id);
  }

  protected updateMeta_(id?: string): void {
    this._logger.logMethod?.('_updateMeta');
    const now = Date.now();
    this.context_.meta.rev++;
    this.context_.meta.updated = now;
    if(id !== undefined) {
      const itemMeta = this.item_(id).meta;
      itemMeta.rev++;
      itemMeta.updated = now;
    }
  }
}
