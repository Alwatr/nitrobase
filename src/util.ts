import { existsSync, promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { debug } from 'debug';
export const log = debug('1db');

export async function readJsonFile <T extends Record<string | number, unknown>>(path: string): Promise<T | null> {
  log(`readJsonFile ${path}`);

  path = resolve(path);
  if (!existsSync(path)) {
    return null;
  }

  const fileContent = await fs.readFile(path, {encoding: 'utf-8'});
  log(`readJsonFile: ${fileContent.length} characters loaded`);

  return JSON.parse(fileContent);
};

export async function writeJsonFile (path: string, data: unknown): Promise<void> {
  log(`writeJsonFile ${path}`);

  path = resolve(path);
  if (!existsSync(path)) {
    await fs.mkdir(dirname(path), {recursive: true});
  }

  const json = JSON.stringify(data, undefined, 2);
  await fs.writeFile(path, json, {encoding: 'utf-8'});
  log(`writeJsonFile: ${json.length} characters saved`);
};
