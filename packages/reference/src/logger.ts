import {definePackage} from '@alwatr/dedupe';
import {createLogger} from '@alwatr/logger';

definePackage('@alwatr/store-reference', __package_version__);

export const logger = createLogger('store-reference');
