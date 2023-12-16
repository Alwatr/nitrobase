import {createLogger, definePackage} from '@alwatr/logger';

declare global {
  // eslint-disable-next-line no-var
  var __package_version: string;
}

definePackage('store-node-fs', __package_version);

export const logger = createLogger('store-node-fs');
