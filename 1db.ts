import { existsSync, promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { debounce } from 'lodash';
import { debug } from 'debug';
const log = debug('1db');

export interface StorageInterface {
  [key: string]: StorageItemInterface;
}

export interface StorageItemInterface {
  _id: string;
  [key: string]: unknown;
}

export const readJsonFile = async <T>(path: string): Promise<T | undefined> => {
  log(`readJsonFile ${path}`);
  path = resolve(path);

  if (!existsSync(path)) {
    return undefined;
  }

  const fileContent = await fs.readFile(path, {encoding: 'utf-8'});
  log(`${fileContent.length} characters loaded`);

  return JSON.parse(fileContent) as T;
}

export const writeJsonFile = async (path: string, data: any): Promise<void> => {
  log(`writeJsonFile ${path}`);
  path = resolve(path);
  if (!existsSync(path)) {
    await fs.mkdir(dirname(path), {recursive: true});
  }
  const json = JSON.stringify(data, undefined, 2);
  await fs.writeFile(path, json, {encoding: 'utf-8'});
  log(`${json.length} characters saved`);
}

export default class OneDB {


  private storagePath!: string;
  private data: StorageInterface = {};
  private loadingPromise: Promise<void> | undefined;
  private dataKeyArr: string[] | undefined;

  /**
   * Open JSON file
   */
  constructor (storagePath: string) {
    log(`open ${storagePath}`);
    this.storagePath = storagePath;
    this.loadingPromise = new Promise(async resolve => {
      this.data = await readJsonFile(this.storagePath!) || {};
      this.dataKeyArr = Object.keys(this.data);
      resolve();
    });
  }

  /**
   * Insert new item
   */
  async set(id: string, data: StorageItemInterface): Promise<void> {
    log(`set ${id}`);
    await this.loadingPromise;
    if (!this.data[id]) {
      this.dataKeyArr!.push(id);
    }
    data._id = id;
    this.data[id] = data;
    this.saveRequest();
  }

  /**
   * Get single item base on id
   */
  async get<T extends StorageItemInterface>(id: string): Promise<T | undefined> {
    log(`get ${id}`);
    if (!id) return undefined;
    await this.loadingPromise;
    return this.data[id] as T || undefined;
  }

  /**
   * Get all items
   */
  async getAll<T extends StorageInterface>(): Promise<T> {
    log('getAll');
    await this.loadingPromise;
    return this.data as T;
  }

  /**
   * Find single item
   */
  async find(predicate: (dataItem: StorageItemInterface) => boolean): Promise<string | undefined> {
    log('find');
    await this.loadingPromise;
    for (const key of this.dataKeyArr!) {
      if (predicate(this.data[key])) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Find all item
   */
  async findAll(predicate: (dataItem: StorageItemInterface) => boolean): Promise<string[]> {
    log('findAll');
    await this.loadingPromise;
    const result: string[] = [];
    for (const key of this.dataKeyArr!) {
      if (predicate(this.data[key])) {
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
    delete this.data[id];
    this.dataKeyArr = Object.keys(this.data);
    this.saveRequest();
  }

  saveRequest = debounce((): void => {
    log('Save db');
    writeJsonFile(this.storagePath, this.data);
  }, 100, {
    leading: false,
    trailing: true,
    maxWait: 1000,
  });
}
