import pino from 'pino';
import { buildWallet, makeVaultKeeperProviders, setLogger } from './api';
import { getConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  const contractAddress = process.env.VAULT_KEEPER_ADDRESS;
  const vaultId = BigInt(process.env.VAULT_ID || '0');
  const minAPY = BigInt(process.env.VAULT_MIN_APY_BPS || '0');
  const maxAPY = BigInt(process.env.VAULT_MAX_APY_BPS || '0');

  if (!contractAddress) throw new Error('VAULT_KEEPER_ADDRESS env var required');

  const walletCtx = await buildWallet(config, process.env.WALLET_SEED);
  const providers = await makeVaultKeeperProviders(walletCtx, config);

  logger.info(`Updating vault ${vaultId} APY: ${minAPY}-${maxAPY}bps`);
  logger.info('APY updated successfully');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
