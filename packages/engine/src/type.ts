export interface AlwatrStorageEngineConfig {
  /**
   * Storage name.
   */
  name: string;

  /**
   * Storage path.
   *
   * @default './db'
   */
  path?: string;

  /**
   * Save debounce timeout for minimal disk iops usage.
   *
   * @default 1000
   */
  saveDebounce?: number;

  /**
   * Write pretty formatted JSON file.
   *
   * @default false
   */
  saveBeautiful?: boolean;

  /**
   * Enable or disable debug mode.
   *
   * @default undefined Auto detect base on `NODE_ENV`
   */
  devMode?: boolean;
}

/**
 * Configuration options for the AlwatrStorageEngineProvider.
 */
export interface AlwatrStorageEngineProviderConfig {
  /**
   * Default storage path. You can override it in the getConfigParams method.
   *
   * @default './db'
   */
  path?: string;

  /**
   * Save debounce timeout for minimal disk I/O operations usage.
   *
   * @default 100
   */
  saveDebounce?: number;

  /**
   * Write pretty formatted JSON file.
   *
   * @default false
   */
  saveBeautiful?: boolean;

  /**
   * Enable or disable debug mode.
   *
   * @default undefined (Auto detect based on `NODE_ENV`)
   */
  devMode?: boolean;
}
