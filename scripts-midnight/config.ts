import path from 'node:path';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const vaultKeeperConfig = {
  privateStateStoreName: 'vaultkeeper-private-state',
  zkConfigPath: path.resolve(currentDir, '..', 'contracts', 'managed', 'vault-keeper'),
};

export const vkprTokenConfig = {
  privateStateStoreName: 'vkpr-token-private-state',
  zkConfigPath: path.resolve(currentDir, '..', 'contracts', 'managed', 'vkpr-token'),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
  readonly networkId: 'undeployed' | 'preview' | 'preprod' | 'mainnet';
}

export class UndeployedConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone');
  indexer = 'http://127.0.0.1:8088/api/v4/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v4/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  networkId = 'undeployed' as const;
  constructor() { setNetworkId('undeployed'); }
}

export class PreprodConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod');
  indexer = 'https://indexer.preprod.midnight.network/api/v4/graphql';
  indexerWS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
  node = 'https://rpc.preprod.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  networkId = 'preprod' as const;
  constructor() { setNetworkId('preprod'); }
}

export class PreviewConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preview');
  indexer = 'https://indexer.preview.midnight.network/api/v4/graphql';
  indexerWS = 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';
  node = 'https://rpc.preview.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  networkId = 'preview' as const;
  constructor() { setNetworkId('preview'); }
}

export class MainnetConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'mainnet');
  indexer = 'https://indexer.mainnet.midnight.network/api/v4/graphql';
  indexerWS = 'wss://indexer.mainnet.midnight.network/api/v4/graphql/ws';
  node = 'https://rpc.mainnet.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  networkId = 'mainnet' as const;
  constructor() { setNetworkId('mainnet'); }
}

export function getConfig(): Config {
  const network = process.env.MIDNIGHT_NETWORK || 'undeployed';
  switch (network) {
    case 'undeployed': return new UndeployedConfig();
    case 'preprod': return new PreprodConfig();
    case 'preview': return new PreviewConfig();
    case 'mainnet': return new MainnetConfig();
    default: throw new Error(`Unknown network: ${network}`);
  }
}
