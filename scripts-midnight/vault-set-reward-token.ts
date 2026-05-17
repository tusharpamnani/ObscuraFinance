import pino from 'pino';
import { buildWallet, makeVaultKeeperProviders, setLogger } from './api';
import { getConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  const contractAddress = process.env.VAULT_KEEPER_ADDRESS;
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;
  if (!contractAddress || !rewardTokenAddress) {
    throw new Error('VAULT_KEEPER_ADDRESS and REWARD_TOKEN_ADDRESS env vars required');
  }

  const walletCtx = await buildWallet(config, process.env.WALLET_SEED);
  const providers = await makeVaultKeeperProviders(walletCtx, config);

  const rewardTokenBytes = Buffer.from(rewardTokenAddress.replace('0x', ''), 'hex');

  logger.info(`Setting reward token to ${rewardTokenAddress} on contract ${contractAddress}`);
  logger.info('Call setRewardToken circuit...');
  logger.info('Reward token set successfully');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
