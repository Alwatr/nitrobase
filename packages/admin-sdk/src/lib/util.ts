import {logger} from '../logger';

/**
 * Parse json string.
 *
 * @param content - json string
 * @returns json object
 * @example
 * ```typescript
 * const json = parseJson('{"a":1,"b":2}');
 * console.log(json.a); // 1
 * ```
 */
export function parseJson(content: string) {
  try {
    return JSON.parse(content);
  }
  catch (err) {
    logger.error('parseJson', 'invalid_json', err);
    throw new Error('invalid_json', {cause: (err as Error).cause});
  }
}

/**
 * Stringify json object.
 *
 * @param data - json object
 * @returns json string
 * @example
 * ```typescript
 * const json = jsonStringify({a:1, b:2});
 * console.log(json); // '{"a":1,"b":2}'
 * ```
 */
export function jsonStringify(data: unknown): string {
  try {
    return JSON.stringify(data);
  }
  catch (err) {
    logger.error('jsonStringify', 'stringify_failed', err);
    throw new Error('stringify_failed', {cause: (err as Error).cause});
  }
}
