import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import pino from 'pino';
import { buildWallet, makeVaultKeeperProviders, setLogger } from './api';
import { getConfig, vaultKeeperConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  logger.info(`Deploying VaultKeeper on network: ${config.networkId}`);

  logger.info('Step 1: Building wallet...');
  const walletCtx = await buildWallet(config, process.env.WALLET_SEED);
  logger.info(`Wallet address: ${walletCtx.unshieldedKeystore.getBech32Address()}`);

  const ownerPubKey = walletCtx.unshieldedKeystore.getPublicKey().toBytes();
  const ownerHex = toHex(ownerPubKey);
  logger.info(`Owner public key: ${ownerHex}`);

  const compiledContract = CompiledContract.make('vault-keeper', {} as any).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(vaultKeeperConfig.zkConfigPath),
  );

  const providers = await makeVaultKeeperProviders(walletCtx, config);

  logger.info('Deploying VaultKeeper contract...');
  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: 'vaultKeeperPrivateState',
    initialPrivateState: { deposits: new Map() },
    constructorArgs: [ownerPubKey],
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`VaultKeeper deployed at: ${contractAddress}`);
  logger.info(`Owner: ${ownerHex}`);
  logger.info(`Seed: ${walletCtx.seedHex}`);
  logger.info('Save these values for management scripts.');

  console.log(`\nVaultKeeper deployed successfully!
  Network:    ${config.networkId}
  Address:    ${contractAddress}
  Owner PK:   ${ownerHex}
  Wallet Seed: ${walletCtx.seedHex}`);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
