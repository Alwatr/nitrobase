import { debounce } from 'lodash';
import { log, readJsonFile, writeJsonFile } from './util';

export interface DocumentList extends Record<string, DocumentItem | string | undefined> {
  _latest?: string,
}

export interface DocumentItem extends Record<string, unknown> {
  _id: string;
  _created: number;
  _modified: number;
}

export class OneDB {
  private path: string;
  private storage?: DocumentList;
  private storageKeyList?: string[];
  private loadingPromise: Promise<void>;

  /**
   * Open JSON file
   */
  constructor (storagePath: string) {
    log(`open ${storagePath}`);
    this.path = storagePath;
    this.loadingPromise = new Promise(async resolve => {
      this.storage = await readJsonFile<DocumentList>(this.path!);
      resolve();
    });
  }

  /**
   * Insert/Update special record
   */
  async set(id: string, data: DocumentItem, replace: boolean = false): Promise<DocumentItem> {
    log(`set ${id}`);
    await this.loadingPromise;

    
    let oldData = this.storage![id];
    if (oldData !== undefined && typeof oldData !== 'object') {
      oldData = undefined;
    }
    data._id = id;
    data._created = oldData?._created ?? Date.UTC();


    if (id in this.storage!) {
      if (this.storageKeyList == undefined) {
        
      }
      this.storageKeyList!.push(id);
    }
    else {

    }

    
    this.storage[id] = data;
    this.saveRequest();
  }

  /**
   * Get single item base on id
   */
  async get<T extends DocumentItem>(id: string): Promise<T | undefined> {
    log(`get ${id}`);
    if (!id) return undefined;
    await this.loadingPromise;
    return this.storage[id] as T || undefined;
  }

  /**
   * Get all items
   */
  async getAll<T extends DocumentList>(): Promise<T> {
    log('getAll');
    await this.loadingPromise;
    return this.storage as T;
  }

  /**
   * Find single item
   */
  async find(predicate: (dataItem: DocumentItem) => boolean): Promise<string | undefined> {
    log('find');
    await this.loadingPromise;
    for (const key of this.storageKeyList!) {
      if (predicate(this.storage[key])) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Find all item
   */
  async findAll(predicate: (dataItem: DocumentItem) => boolean): Promise<string[]> {
    log('findAll');
    await this.loadingPromise;
    const result: string[] = [];
    for (const key of this.storageKeyList!) {
      if (predicate(this.storage[key])) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * delete items base in query
   */
  async delete(id: string): Promise<void> {
    log('delete', id);
    await this.loadingPromise;
    delete this.storage[id];
    this.storageKeyList = Object.keys(this.storage);
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
