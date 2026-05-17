import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { Buffer } from 'buffer';
import pino from 'pino';
import { buildWallet, makeVkprTokenProviders, setLogger } from './api';
import { getConfig, vkprTokenConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  logger.info(`Deploying VKPR Token on network: ${config.networkId}`);

  const walletCtx = await buildWallet(config, process.env.WALLET_SEED);
  const ownerPubKey = walletCtx.unshieldedKeystore.getPublicKey().toBytes();
  const ownerHex = toHex(ownerPubKey);

  const compiledContract = CompiledContract.make('vkpr-token', {} as any).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(vkprTokenConfig.zkConfigPath),
  );

  const providers = await makeVkprTokenProviders(walletCtx, config);

  logger.info('Deploying VKPR Token contract...');
  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: 'vkprTokenPrivateState',
    initialPrivateState: {},
    constructorArgs: [
      Buffer.from('VaultKeeper Reward Token'),
      Buffer.from('VKPR'),
      18,
      ownerPubKey,
    ],
  });

  const tokenAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`VKPR Token deployed at: ${tokenAddress}`);

  console.log(`\nVKPR Token deployed successfully!
  Network:    ${config.networkId}
  Address:    ${tokenAddress}
  Owner PK:   ${ownerHex}`);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
