import { createLogger } from '@alwatr/logger';

import type {DocumentContext, StoreFileMeta} from './type.js';

export class DocumentReference<TDoc extends Record<string, unknown> = Record<string, unknown>> {
  protected _logger = createLogger(`doc:${this.context_.meta.id.slice(0, 20)}`, true);

  constructor(
    protected context_: DocumentContext<TDoc>,
    protected updatedCallback_: (id: string) => void,
  ) {
    this._logger.logMethodArgs?.('new', context_.meta.id);
  }

  get(): TDoc {
    this._logger.logMethod?.('get');
    return this.context_.data;
  }

  meta(): Readonly<StoreFileMeta> {
    this._logger.logMethod?.('meta');
    return this.context_.meta;
  }

  set(data: TDoc): void {
    this._logger.logMethodArgs?.('set', data);
    this.context_.data = data;
    this._updated();
  }

  update(data: Partial<TDoc>): void {
    this._logger.logMethodArgs?.('update', data);
    Object.assign(this.context_.data, data);
    this._updated();
  }

  save(): void {
    this._logger.logMethod?.('save');
    this._updated();
  }

  _updateMeta(): void {
    this._logger.logMethod?.('_updateMeta');
    this.context_.meta.updated = Date.now();
    this.context_.meta.rev++;
  }

  protected _updated(): void {
    this._logger.logMethod?.('_updated');
    this._updateMeta();
    this.updatedCallback_(this.context_.meta.id);
  }
}
