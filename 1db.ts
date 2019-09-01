import fs from 'fs';
import path from 'path';
import debounce from 'lodash/debounce';
import { debug } from 'debug';
const log = debug('1db');

export default class OneDB {
  private dbPath: string;
  private data: {};
  private loading: Promise<any>;
  private dataKeyArr: string[];

  /**
   * Open JSON file
   */
  async open(dbPath: string): Promise<void> {
    log(`open ${dbPath}`);
    if (!dbPath) throw 'dbPath not defined';
    this.dbPath = dbPath;
    this.loading = OneDB.readJsonFile(this.dbPath);
    this.data = await this.loading || {};
    this.dataKeyArr = Object.keys(this.data);
    return;
  }

  /**
   * Insert new item
   */
  async update(id: string, obj: any): Promise<void> {
    log(`update ${id}`);
    await this.loading;
    if (!this.data[id]) {
      this.dataKeyArr.push(id);
    }
    this.data[id] = obj;
    this.data[id]._id = id;
    this.save();
    return;
  }

  /**
   * Get single item base on id
   */
  async get(id: string): Promise<any> {
    log(`get ${id}`);
    if (!id) return undefined;
    await this.loading;
    return this.data[id] || undefined;
  }

  /**
   * Find single item
   */
  async find(predicate: Function): Promise<string> {
    log('find');
    await this.loading;
    for (const key of this.dataKeyArr) {
      if (predicate(this.data[key])) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Find all item
   */
  async findAll(predicate: Function): Promise<string[]> {
    log('find');
    await this.loading;
    const result = [];
    for (const key of this.dataKeyArr) {
      if (predicate(this.data[key])) {
        result.push(key);
      }
    }
    return result.length ? result : undefined;
  }

  /**
   * delete items base in query
   */
  async delete(id: string): Promise<void> {
    log('delete', id);
    await this.loading;
    delete this.data[id];
    this.dataKeyArr = Object.keys(this.data);
    this.save();
  }

  save = debounce((): void => {
    log('Save db');
    OneDB.writeJsonFile(this.dbPath, this.data);
  }, 1000);

  static async readJsonFile(dbPath: string): Promise<any> {
    log(`readJsonFile ${dbPath}`);
    dbPath = path.resolve(dbPath);

    if (!fs.existsSync(dbPath)) {
      return undefined;
    }

    const fileContent = await fs.promises.readFile(dbPath, {encoding: 'utf-8'});
    log(`${fileContent.length} characters loaded`);

    return JSON.parse(fileContent);
  }

  static async writeJsonFile(dbPath: string, data: any): Promise<void> {
    log(`writeJsonFile ${dbPath}`);
    dbPath = path.resolve(dbPath);
    if (!fs.existsSync(dbPath)) {
      await fs.promises.mkdir(path.dirname(dbPath), {recursive: true});
    }
    const json = JSON.stringify(data, undefined, 2);
    await fs.promises.writeFile(dbPath, json, {encoding: 'utf-8'});
    log(`${json.length} characters saved`);
  }
}
