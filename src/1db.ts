import { debounce } from 'lodash';
import { log, readJsonFile, writeJsonFile, utcTimestamp } from './util';

export interface DocumentStorage extends Record<string, DocumentRecord | string | undefined> {
  _latest?: string,
}

export interface DocumentRecord extends Record<string, unknown> {
  _id: string;
  _created: number;
  _modified: number;
}

export class OneDB {
  private path: string;
  private storage: Promise<DocumentStorage>;
  private indexList?: string[];

  /**
   * Open JSON file
   */
  constructor (storagePath: string) {
    log(`open ${storagePath}`);
    this.path = storagePath;
    this.storage = readJsonFile<DocumentStorage>(this.path!);
    this.storage.catch(err => { throw err });
  }

  protected async _updateIndexList(id?: string) {
    if (id != undefined && this.indexList == undefined) { return; } // no index created yet and maybe not need at all
    
    const storage = await this.storage;

    if (this.indexList == undefined) {
      this.indexList = Object.keys(storage)
    }

    if (id != undefined && !(id in this.indexList)) {
      this.indexList.push(id);
    }
  }

  /**
   * Insert/Update a document record
   */
  async set(id: string, data: DocumentRecord, replace: boolean = false): Promise<DocumentRecord> {
    log(`set ${id}`);
    if (id === '_latest') { throw new Error('forbidden_key'); }

    const storage = await this.storage;

    let oldData = storage[id];
    if (typeof oldData !== 'object') {
      oldData = undefined; // invalid data!
    }

    data._id = id;
    data._modified = oldData?._modified ?? utcTimestamp();
    data._created = oldData?._created ?? data._modified;

    if (!replace) {
      data = {
        ...oldData,
        ...data,
      }
    }

    storage[id] = data;
    void this._updateIndexList(id);

    this.saveRequest();
    return data;
  }

  /**
   * Get a document record
   */
  async get<T extends DocumentRecord>(id: string): Promise<T | undefined> {
    log(`get ${id}`);
    if (id == null) return undefined;
    const storage = await this.storage;
    const data = storage[id];
    if (typeof data === 'string') {
      return this.get(data);
    }
    else {
      return data as T;
    }
  }

  /**
   * Get all items
   */
  async _getStorage(): Promise<DocumentStorage> {
    log('_getStorage');
    return this.storage;
  }

  /**
   * Find single item
   */
  async find(predicate: (documentRecord: DocumentRecord) => boolean): Promise<DocumentRecord | undefined> {
    log('find');
    await this._updateIndexList();
    const storage = await this.storage;
    for (const id of this.indexList!) {
      const documentRecord = storage[id];
      if (documentRecord != undefined && typeof documentRecord !== 'string' && predicate(documentRecord)) {
        return documentRecord;
      }
    }
    return undefined;
  }

  /**
   * Find all item
   */
  async findAll(predicate: (documentRecord: DocumentRecord) => boolean): Promise<Array<DocumentRecord>> {
    log('findAll');
    await this._updateIndexList();
    const storage = await this.storage;
    const result: Array<DocumentRecord> = [];
    for (const id of this.indexList!) {
      const documentRecord = storage[id];
      if (documentRecord != undefined && typeof documentRecord !== 'string' && predicate(documentRecord)) {
        result.push(documentRecord);
      }
    }
    return result;
  }

  /**
   * delete items base in query
   */
  async delete(id: string): Promise<void> {
    log('delete', id);
    const storage = await this.storage;
    delete storage[id];
    delete this.indexList; // need to re-index
    this.saveRequest();
  }

  saveRequest = debounce((): void => {
    log('Save db');
    writeJsonFile(this.path, this.storage);
  }, 100, {
    leading: false,
    trailing: true,
    maxWait: 1000,
  });
}
