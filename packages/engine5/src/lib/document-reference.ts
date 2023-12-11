import {createLogger} from '@alwatr/logger';

import {logger} from './logger.js';

import type {DocumentContext, StoreFileMeta} from './type.js';

logger.logModule?.('document-reference');

/**
 * Document reference have methods to get, set, update and save the Alwatr Store Document.
 *
 * This class is dummy in saving and loading the document.
 * It's the responsibility of the Alwatr Store to save and load the document.
 *
 * @template TDoc The document data type.
 */
export class DocumentReference<TDoc extends Record<string, unknown> = Record<string, unknown>> {
  protected _logger = createLogger(`doc:${this.context_.meta.id.slice(0, 20)}`);

  /**
   * @param context_ Document's context filled from the Alwatr Store (parent).
   * @param updatedCallback_ updated callback to invoke when the document is updated from the Alwatr Store (parent).
   */
  constructor(
    protected context_: DocumentContext<TDoc>,
    protected updatedCallback_: (id: string) => void,
  ) {
    this._logger.logMethodArgs?.('new', context_.meta.id);
  }

  /**
   * Get Document's data.
   *
   * @returns Document's data.
   */
  get(): TDoc {
    this._logger.logMethod?.('get');
    return this.context_.data;
  }

  /**
   * Get Document's metadata.
   *
   * @returns Document's metadata.
   */
  meta(): Readonly<StoreFileMeta> {
    this._logger.logMethod?.('meta');
    return this.context_.meta;
  }

  /**
   * Set Document's data.
   *
   * @param data New document data.
   */
  set(data: TDoc): void {
    this._logger.logMethodArgs?.('set', data);
    this.context_.data = data;
    this.updated_();
  }

  /**
   * Update Document's data.
   * Can be used to update a part of the document.
   *
   * @param {Partial<TDoc>} data Data to update the document with.
   */
  update(data: Partial<TDoc>): void {
    this._logger.logMethodArgs?.('update', data);
    Object.assign(this.context_.data, data);
    this.updated_();
  }

  /**
   * Request the Alwatr Store to save the document.
   *
   * Saving may take some time in Alwatr Store due to the use of throttling.
   */
  save(): void {
    this._logger.logMethod?.('save');
    this.updated_();
  }

  /**
   * Updates the document's metadata.
   */
  protected updateMeta_(): void {
    this._logger.logMethod?.('_updateMeta');
    this.context_.meta.updated = Date.now();
    this.context_.meta.rev++;
  }

  /**
   * Notify the Alwatr Store (parent) that the document is updated.
   *
   * Alwatr Store save the document to the storage based the throttling.
   */
  protected updated_(): void {
    this._logger.logMethod?.('_updated');
    this.updateMeta_();
    this.updatedCallback_(this.context_.meta.id);
  }
}
