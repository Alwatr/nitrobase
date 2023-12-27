import {type FetchOptions, serviceRequest} from '@alwatr/fetch';
import {CollectionReference, DocumentReference} from '@alwatr/store-reference';
import {CollectionContext, DocumentContext} from '@alwatr/store-types';
import {AlwatrServiceResponse} from '@alwatr/type';

import {StoreFileStatModel} from './lib/store-file-stat';
import {logger} from './logger';

import type {Dictionary, JSONValue} from '@alwatr/type-helper';

logger.logModule?.('alwatr-store');

export interface AlwatrStoreAdminSdkConfig {
  host: string;
  port: number;
  token: string;
  fetchOptions: Partial<FetchOptions>;
}

/**
 * AlwatrStore engine.
 *
 * It provides methods to read, write, validate, and manage store files.
 * It also provides methods to interact with `documents` and `collections` in the store.
 */
export class AlwatrStoreAdminSdk {
  /**
   * The default configuration of the fetch.
   */
  static defaultFetchOptions_: Partial<FetchOptions> = {
    timeout: 10_000,
    keepalive: true,
    cacheStrategy: 'network_only',
    removeDuplicate: 'never',
    retry: 3,
    retryDelay: 500,
  };

  /**
   * Constructs an AlwatrStore instance with the provided configuration.
   *
   * @param config_ The configuration of the AlwatrStore engine.
   * @example
   * ```typescript
   * const alwatrStore = new AlwatrStore({
   *   rootPath: './db',
   *   saveDebounce: 100,
   * });
   * ```
   */
  constructor(private readonly config_: AlwatrStoreAdminSdkConfig) {
    logger.logMethodArgs?.('new', config_);
    config_.fetchOptions.url ??= 'http://' + config_.host + ':' + config_.port + '/';
    config_.fetchOptions.token = config_.token;
  }

  /**
   * Checks if a store file with the given id exists.
   *
   * @param id store file id
   * @returns true if a store file with the given id exists, false otherwise
   * @example
   * ```typescript
   * if (!alwatrStore.exists('user1/profile')) {
   *   alwatrStore.defineDocument(...)
   * }
   * ```
   */
  async exists(stat: StoreFileStatModel): Promise<boolean> {
    logger.logMethodArgs?.('exists', stat.id);
    const response = await this.request_<{exists: boolean}>('/exists', 'GET', {value: stat.value});
    return response.data.exists;
  }

  /**
   * Defines a document in the store with the given configuration and initial data.
   * Document defined immediately and you don't need to await, unless you want to catch writeContext errors.
   *
   * @template TDoc document data type
   * @param config store file config
   * @param initialData initial data for the document
   * @example
   * ```typescript
   * await alwatrStore.defineDocument<Order>({
   *  id: 'user1/profile',
   *  region: Region.PerUser,
   *  ttl: StoreFileTTL.medium,
   * }, {
   *   name: 'Ali',
   *   email: 'ali@alwatr.io',
   * });
   * ```
   */
  async defineDocument<TDoc extends Record<string, unknown>>(stat: StoreFileStatModel, initialData: TDoc): Promise<void> {
    logger.logMethodArgs?.('defineDocument', stat.value);
    await this.request_<DocumentContext<TDoc>>(`/define-document`, 'POST', {value: stat.value, initialData});
  }

  /**
   * Defines a collection in the store with the given configuration.
   * collection defined immediately and you don't need to await, unless you want to catch writeContext errors.
   *
   * @param config store file config
   * @example
   * ```typescript
   * alwatrStore.defineCollection({
   *   id: 'user1/orders',
   *   region: Region.PerUser,
   *   ttl: StoreFileTTL.medium,
   * });
   * ```
   */
  async defineCollection(stat: StoreFileStatModel): Promise<void> {
    logger.logMethodArgs?.('defineCollection', stat.value);
    await this.request_<CollectionContext<Dictionary>>(`/define-collection`, 'POST', {value: stat.value});
  }

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
  async doc<TDoc extends Record<string, unknown>>(stat: StoreFileStatModel): Promise<DocumentReference<TDoc>> {
    logger.logMethodArgs?.('doc', stat.id);
    const context = await this.request_<DocumentContext<TDoc>>('/doc', 'GET', {value: stat.value});
    return DocumentReference.newRefFromContext<TDoc>(context, this.updateDoc_.bind(this));
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
  async collection<TItem extends Record<string, unknown>>(stat: StoreFileStatModel): Promise<CollectionReference<TItem>> {
    logger.logMethodArgs?.('collection', stat.id);
    const context = await this.request_<CollectionContext<TItem>>('/collection', 'GET', {value: stat.value});
    return CollectionReference.newRefFromContext<TItem>(context, this.updateDoc_.bind(this));
  }

  /**
   * Deletes the store file with the given id from the store and unload it from memory.
   *
   * @param id The unique identifier of the store file.
   * @example
   * ```typescript
   * alwatrStore.deleteFile('user1/profile');
   * alwatrStore.exists('user1/orders'); // false
   * ```
   */
  async deleteFile(stat: StoreFileStatModel): Promise<void> {
    logger.logMethodArgs?.('deleteFile', stat.id);
    await this.request_<{id: string}>('/delete-file', 'POST', {id: stat.id});
  }

  protected async request_<T extends JSONValue>(
    path: string,
    method: string,
    body?: Record<string, unknown>,
  ): Promise<AlwatrServiceResponse<T>> {
    logger.logMethodArgs?.('request_', {method, path, body});

    return serviceRequest<AlwatrServiceResponse<T>>({
      ...AlwatrStoreAdminSdk.defaultFetchOptions_,
      ...this.config_.fetchOptions,
      url: this.config_.fetchOptions.url + path,
      method,
      bodyJson: body,
    });
  }

  protected updateDoc_<T extends JSONValue>(from: CollectionReference | DocumentReference): Promise<T> {}
}
