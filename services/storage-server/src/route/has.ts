import {config, logger} from '../config.js';
import {nanoServer} from '../lib/nano-server.js';
import {storageProvider} from '../lib/storage-provider.js';

import type {AlwatrConnection} from '@alwatr/nano-server';

nanoServer.route('GET', '/has', has);

async function has(connection: AlwatrConnection): Promise<void> {
  logger.logMethod('has');

  const token = connection.requireToken(config.nanoServer.accessToken);
  if (token == null) return;

  const params = connection.requireQueryParams<{storage: string; id: string}>({storage: 'string', id: 'string'});
  if (params == null) return;

  const storageEngine = storageProvider.get({name: params.storage});

  connection.reply({
    ok: true,
    data: {has: storageEngine.has(params.id)},
  });
}
