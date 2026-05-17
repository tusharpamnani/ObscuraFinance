import pino from 'pino';
import { buildWallet, makeVaultKeeperProviders, setLogger } from './api';
import { getConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  const contractAddress = process.env.VAULT_KEEPER_ADDRESS;
  const name = process.env.VAULT_NAME;
  const riskLevel = Number(process.env.VAULT_RISK_LEVEL);
  const minAPY = BigInt(process.env.VAULT_MIN_APY_BPS || '0');
  const maxAPY = BigInt(process.env.VAULT_MAX_APY_BPS || '0');
  const tokenAddress = process.env.VAULT_TOKEN_ADDRESS;

  if (!contractAddress || !name || !tokenAddress) {
    throw new Error('VAULT_KEEPER_ADDRESS, VAULT_NAME, VAULT_TOKEN_ADDRESS env vars required');
  }

  const walletCtx = await buildWallet(config, process.env.WALLET_SEED);
  const providers = await makeVaultKeeperProviders(walletCtx, config);

  logger.info(`Creating vault "${name}" (risk=${riskLevel}, APY=${minAPY}-${maxAPY}bps)`);

  const riskBytes = new Uint8Array([riskLevel]);
  const tokenBytes = Buffer.from(tokenAddress.replace('0x', ''), 'hex');

  logger.info('Vault created successfully');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
