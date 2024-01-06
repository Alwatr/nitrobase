import {definePackage} from '@alwatr/dedupe'
import {createLogger} from '@alwatr/logger';

definePackage('@alwatr/store-engine', __package_version__);

export const logger = createLogger('store-engine', true);
