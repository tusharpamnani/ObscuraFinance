export type MidnightNetworkId = 'undeployed' | 'preview' | 'preprod' | 'mainnet';

export interface MidnightNetworkConfig {
  networkId: MidnightNetworkId;
  name: string;
  indexerHttp: string;
  indexerWs: string;
  rpc: string;
  proofServerUrl: string;
  dustMode: 'manual' | 'sponsored';
  explorerUrl?: string;
  tokenSymbol: string;
}

export const MIDNIGHT_NETWORKS: Record<MidnightNetworkId, MidnightNetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    name: 'Local Devnet (Undeployed)',
    indexerHttp: 'http://localhost:8088/api/v4/graphql',
    indexerWs: 'ws://localhost:8088/api/v4/graphql/ws',
    rpc: 'ws://localhost:9944',
    proofServerUrl: 'http://127.0.0.1:6300',
    dustMode: 'manual',
    tokenSymbol: 'tNIGHT',
  },
  preview: {
    networkId: 'preview',
    name: 'Midnight Preview',
    indexerHttp: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWs: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    rpc: 'wss://rpc.preview.midnight.network',
    proofServerUrl: 'https://api-preview.1am.xyz',
    dustMode: 'sponsored',
    explorerUrl: 'https://explorer.preview.midnight.network',
    tokenSymbol: 'NIGHT',
  },
  preprod: {
    networkId: 'preprod',
    name: 'Midnight Preprod',
    indexerHttp: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWs: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    rpc: 'https://rpc.preprod.midnight.network',
    proofServerUrl: 'http://127.0.0.1:6300',
    dustMode: 'manual',
    explorerUrl: 'https://explorer.preprod.midnight.network',
    tokenSymbol: 'tNIGHT',
  },
  mainnet: {
    networkId: 'mainnet',
    name: 'Midnight Mainnet',
    indexerHttp: 'https://indexer.mainnet.midnight.network/api/v4/graphql',
    indexerWs: 'wss://indexer.mainnet.midnight.network/api/v4/graphql/ws',
    rpc: 'https://rpc.mainnet.midnight.network',
    proofServerUrl: 'https://api.1am.xyz',
    dustMode: 'sponsored',
    explorerUrl: 'https://explorer.mainnet.midnight.network',
    tokenSymbol: 'NIGHT',
  },
};

export const DEFAULT_MIDNIGHT_NETWORK: MidnightNetworkId = 'preview';
