import {AlwatrStorageEngineProvider} from '@alwatr/storage-engine';

import {config} from '../config.js';

export const storageProvider = new AlwatrStorageEngineProvider(config.storage);
