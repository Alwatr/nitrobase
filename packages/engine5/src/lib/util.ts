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
