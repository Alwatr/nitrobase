import {resolve} from 'node:path';

import {createLogger} from '@alwatr/logger';

export const logger = createLogger('storage-api');

/**
 * Configuration object for the API.
 */
export const config = {
  nanoServer: {
    /**
     * The host address for the Nano server.
     * Defaults to '0.0.0.0' if not provided.
     */
    host: process.env.HOST ?? '0.0.0.0',
    /**
     * The port number for the Nano server.
     * Defaults to 9000 if not provided.
     */
    port: process.env.PORT != null ? +process.env.PORT : 9000,
    /**
     * The access token for the Nano server.
     * Defaults to 'YOUR_SECRET_TOKEN' if not provided.
     */
    accessToken: process.env.ACCESS_TOKEN ?? 'YOUR_SECRET_TOKEN',
  },
  storage: {
    /**
     * The path to the storage directory.
     * Defaults to 'db' if not provided.
     */
    path: resolve(process.env.STORAGE_PATH ?? 'db'),
    /**
     * The debounce time (in milliseconds) for saving data to storage.
     * Defaults to 100 if not provided.
     */
    saveDebounce: process.env.SAVE_DEBOUNCE != null ? +process.env.SAVE_DEBOUNCE : 100,
  },
} as const;

logger.logProperty?.('config', config);
