/**
 * Configuration options for Alwatr Storage.
 */
export interface AlwatrStorageConfig {
  /**
   * Storage name (like database name).
   */
  name?: string;

  /**
   * Storage server host name.
   */
  host: string;

  /**
   * Storage server port number.
   */
  port: number;

  /**
   * Storage server token (like database password).
   */
  token: string;

  /**
   * A timeout in ms for the fetch request.
   *
   * Use with caution, as it may cause memory leak issues in Node.js.
   *
   * @default 0 disabled
   */
  timeout?: number;

  /**
   * Enable or disable debug mode.
   *
   * @default undefined Auto detect based on `NODE_ENV`
   */
  devMode?: boolean;
}
