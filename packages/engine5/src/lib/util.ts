import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import {logger} from './logger.js';

/**
 * Deep clones an object.
 */
export function deepClone<T>(obj: T): T;

/**
 * Deep clones an object.
 *
 * if the object is null or undefined, it returns null.
 */
export function deepClone<T>(obj: T | null | undefined): T | null;

export function deepClone<T>(obj: T | null | undefined): T | null {
  if (obj == null) return null;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Flattens the underlying C structures of a concatenated JavaScript string.
 */
export const flatStr = (s: string): string => {
  // @ts-expect-error because it alters wrong compilation errors.
  s | 0;
  return s;
};

/**
 * Enhanced read json file.
 *
 * @example
 * const fileContent = await readJsonFile('./file.json');
 */
export async function readJsonFile(path: string): Promise<unknown> {
  logger.logMethodArgs?.('readJsonFile', path);

  if (!existsSync(path)) {
    // existsSync is much faster than access.
    throw new Error('file_not_found');
  }

  let content: string;
  try {
    content = flatStr(await readFile(path, {encoding: 'utf-8', flag: 'r'}));
  }
  catch (err) {
    logger.error('readJsonFile', 'read_file_failed', err);
    throw new Error('read_file_failed', {cause: (err as Error).cause});
  }

  let data;
  try {
    data = JSON.parse(content);
  }
  catch (err) {
    logger.error('readJsonFile', 'invalid_json', err);
    throw new Error('invalid_json', {cause: (err as Error).cause});
  }
  return data;
}


/**
 * Enhanced write json file.
 *
 * @example
 * await writeJsonFile('./file.json', { a:1, b:2, c:3 });
 */
export async function writeJsonFile(
  path: string,
  data: unknown,
  existFile: 'replace' | 'copy' | 'rename' = 'rename',
): Promise<void> {
  logger.logMethodArgs?.('writeJsonFile', path);

  let content;
  try {
    content = flatStr(JSON.stringify(data));
  }
  catch (err) {
    logger.error('writeJsonFile', 'stringify_failed', err);
    throw new Error('stringify_failed', {cause: (err as Error).cause});
  }

  if (existsSync(path)) {
    try {
      if (existFile === 'copy') {
        await copyFile(path, path + '.bk');
      }
      else if (existFile === 'rename') {
        await rename(path, path + '.bk');
      }
    }
    catch (err) {
      logger.error('writeJsonFile', 'rename_copy_failed', err);
    }
  }
  else {
    try {
      await mkdir(dirname(path), {recursive: true});
    }
    catch (err) {
      logger.error('writeJsonFile', 'make_dir_failed', err);
      throw new Error('make_dir_failed', {cause: (err as Error).cause});
    }
  }

  try {
    await writeFile(path, content, {encoding: 'utf-8', flag: 'w'});
  }
  catch (err) {
    logger.error('writeJsonFile', 'write_file_failed', err);
    throw new Error('write_file_failed', {cause: (err as Error).cause});
  }
}
