import {createLogger} from '@alwatr/logger';
import {StoreFileType, StoreFileExtension, type StoreFileId, type DocumentContext, type StoreFileMeta} from '@alwatr/store-types';
import {waitForImmediate, waitForTimeout} from '@alwatr/wait';

import {logger} from './logger.js';
import {getStoreId, getStorePath} from './util.js';

import type {Dictionary, JsonifiableObject} from '@alwatr/type-helper';

logger.logModule?.('document-reference');

/**
 * Represents a reference to a document of the AlwatrStore.
 * Provides methods to interact with the document, such as get, set, update and save.
 */
export class DocumentReference<TDoc extends JsonifiableObject = JsonifiableObject> {
  /**
   * Alwatr store engine version string.
   */
  static readonly version = __package_version__;

  /**
   * Alwatr store engine file format version number.
   */
  static readonly fileFormatVersion = 3;

  /**
   * Creates new DocumentReference instance from stat and initial data.
   *
   * @param statId the document stat.
   * @param initialData the document data.
   * @param updatedCallback the callback to invoke when the document changed.
   * @template TDoc The document data type.
   * @returns A new document reference class.
   */
  static newRefFromData<TDoc extends JsonifiableObject>(
    statId: StoreFileId,
    initialData: TDoc,
    updatedCallback: (from: DocumentReference<TDoc>) => unknown,
    debugDomain?: string,
  ): DocumentReference<TDoc> {
    logger.logMethodArgs?.('doc.newRefFromData', statId);

    const now = Date.now();
    const initialContext: DocumentContext<TDoc> = {
      ok: true,
      meta: {
        ...statId,
        rev: 1,
        updated: now,
        created: now,
        type: StoreFileType.Document,
        extension: StoreFileExtension.Json,
        fv: DocumentReference.fileFormatVersion,
      },
      data: initialData,
    };

    return new DocumentReference(initialContext, updatedCallback, debugDomain);
  }

  /**
   * Creates new DocumentReference instance from DocumentContext.
   *
   * @param context the document context.
   * @param updatedCallback the callback to invoke when the document changed.
   * @template TDoc The document data type.
   * @returns A new document reference class.
   */
  static newRefFromContext<TDoc extends JsonifiableObject>(
    context: DocumentContext<TDoc>,
    updatedCallback: (from: DocumentReference<TDoc>) => unknown,
    debugDomain?: string,
  ): DocumentReference<TDoc> {
    logger.logMethodArgs?.('doc.newRefFromContext', context.meta);
    return new DocumentReference(context, updatedCallback, debugDomain);
  }

  /**
   * Validates the document context and try to migrate it to the latest version.
   */
  private validateContext__(): void {
    this.logger__.logMethod?.('validateContext__');

    if (this.context__.ok !== true) {
      this.logger__.accident?.('validateContext__', 'store_not_ok');
      throw new Error('store_not_ok', {cause: {context: this.context__}});
    }

    if (this.context__.meta === undefined) {
      this.logger__.accident?.('validateContext__', 'store_meta_undefined');
      throw new Error('store_meta_undefined', {cause: {context: this.context__}});
    }

    if (this.context__.meta.type !== StoreFileType.Document) {
      this.logger__.accident?.('validateContext__', 'document_type_invalid', this.context__.meta);
      throw new Error('document_type_invalid', {cause: this.context__.meta});
    }

    if (this.context__.meta.fv !== DocumentReference.fileFormatVersion) {
      this.logger__.incident?.('validateContext__', 'store_file_version_incompatible', {
        old: this.context__.meta.fv,
        new: DocumentReference.fileFormatVersion,
      });
      this.migrateContext__();
    }
  }

  /**
   * Migrate the document context to the latest.
   */
  private migrateContext__(): void {
    if (this.context__.meta.fv === DocumentReference.fileFormatVersion) return;

    this.logger__.logMethod?.('migrateContext__');

    if (this.context__.meta.fv > DocumentReference.fileFormatVersion) {
      this.logger__.accident('migrateContext__', 'store_version_incompatible', this.context__.meta);
      throw new Error('store_version_incompatible', {cause: this.context__.meta});
    }

    if (this.context__.meta.fv === 1) {
      // migrate from v1 to v2
      // this.context__.meta.schemaVer = 0
      this.context__.meta.fv = 2;
    }

    if (this.context__.meta.fv === 2) {
      // migrate from v1 to v3
      if (this.context__.meta.schemaVer === undefined || this.context__.meta.schemaVer === 0) {
        this.context__.meta.schemaVer = 1
      }
      delete (this.context__.meta as Dictionary)['ver'];
      this.context__.meta.fv = 3;
    }

    this.save();
  }

  /**
   * The ID of the document store file.
   */
  readonly id: string;

  /**
   * The location path of the document store file.
   */
  readonly path: string;

  /**
   * Indicates whether the collection has unsaved changes.
   */
  hasUnprocessedChanges_ = false;

  /**
   * Logger instance for this document.
   */
  private logger__;

  /**
   * Create a new document reference.
   * Document reference have methods to get, set, update and save the AlwatrStore Document.
   *
   * @param context__ Document's context filled from the Alwatr Store (parent).
   * @param updatedCallback__ updated callback to invoke when the document is updated from the Alwatr Store (parent).
   * @template TDoc The document data type.
   */
  constructor(
    private readonly context__: DocumentContext<TDoc>,
    private readonly updatedCallback__: (from: DocumentReference<TDoc>) => unknown,
    debugDomain?: string,
  ) {
    this.id = getStoreId(this.context__.meta);
    this.path = getStorePath(this.context__.meta);

    debugDomain ??= this.id.slice(0, 20);
    this.logger__ = createLogger(`doc:${debugDomain}`);

    this.logger__.logMethodArgs?.('new', {path: this.path});

    this.validateContext__();
  }

  /**
   * Get store schema version
   *
   * @returns store schema version
   */
  get schemaVer(): number {
    return this.context__.meta.schemaVer ?? 1;
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
   * Retrieves the document's data.
   *
   * @returns The document's data.
   *
   * @example
   * ```typescript
   * const documentData = documentRef.getData();
   * ```
   */
  getData(): TDoc {
    this.logger__.logMethod?.('getData');
    return this.context__.data;
  }

  /**
   * Retrieves the document's metadata.
   *
   * @returns The document's metadata.
   *
   * @example
   * ```typescript
   * const documentMeta = documentRef.gerStoreMetadata();
   * ```
   */
  getStoreMetadata(): Readonly<StoreFileMeta> {
    this.logger__.logMethod?.('getStoreMetadata');
    return this.context__.meta;
  }

  /**
   * Sets the document's data. replacing the existing data.
   *
   * @param data The new document data.
   *
   * @example
   * ```typescript
   * documentRef.overwriteData({ a: 1, b: 2, c: 3 });
   * ```
   */
  replaceData(data: TDoc): void {
    this.logger__.logMethodArgs?.('overwriteData', data);
    (this.context__.data as unknown) = data;
    this.updated__();
  }

  /**
   * Updates document's data by merging a partial update into the document's data.
   *
   * @param data The part of data to merge into the document's data.
   *
   * @example
   * ```typescript
   * documentRef.mergeData({ c: 4 });
   * ```
   */
  mergeData(data: Partial<TDoc>): void {
    this.logger__.logMethodArgs?.('mergeData', data);
    Object.assign(this.context__.data, data);
    this.updated__();
  }

  /**
   * Requests the Alwatr Store to save the document.
   * Saving may take some time in Alwatr Store due to the use of throttling.
   *
   * @example
   * ```typescript
   * documentRef.save();
   * ```
   */
  save(): void {
    this.logger__.logMethod?.('save');
    this.updated__(false);
  }

  /**
   * Requests the Alwatr Store to save the document immediately.
   *
   * @example
   * ```typescript
   * documentRef.saveImmediate();
   * ```
   */
  saveImmediate(): void {
    this.logger__.logMethod?.('saveImmediate');
    this.updated__(true);
  }

  /**
   * Retrieves the full context of the document.
   *
   * @returns The full context of the document.
   *
   * @example
   * ```typescript
   * const context = documentRef.getFullContext_();
   * ```
   */
  getFullContext_(): Readonly<DocumentContext<TDoc>> {
    this.logger__.logMethod?.('getFullContext_');
    return this.context__;
  }

  updateDelayed_ = false;

  /**
   * Update the document metadata and invoke the updated callback.
   * This method is throttled to prevent multiple updates in a short time.
   */
  private async updated__(immediate = false): Promise<void> {
    this.logger__.logMethodArgs?.('updated__', {immediate, delayed: this.updateDelayed_});

    this.hasUnprocessedChanges_ = true;

    if (immediate !== true && this.updateDelayed_ === true) return;
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

    this.refreshMetadata_();

    if (this._freeze === true) return; // prevent save if frozen
    this.updatedCallback__.call(null, this);
  }

  /**
   * Refresh/recalculate the document's metadata timestamp and revision.
   */
  protected refreshMetadata_(): void {
    this.logger__.logMethod?.('refreshMetadata_');
    this.context__.meta.updated = Date.now();
    this.context__.meta.rev++;
  }
}
