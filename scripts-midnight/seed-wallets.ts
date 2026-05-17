import pino from 'pino';
import { buildWallet, setLogger } from './api';
import { getConfig } from './config';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
setLogger(logger);

async function main() {
  const config = getConfig();
  const count = parseInt(process.env.WALLET_COUNT || '1', 10);

  logger.info(`Seeding ${count} wallet(s) on network: ${config.networkId}`);

  for (let i = 0; i < count; i++) {
    const seed = process.env[`WALLET_SEED_${i}`] || process.env.WALLET_SEED;
    const ctx = await buildWallet(config, seed);
    logger.info(`Wallet ${i + 1}/${count} ready:`);
    logger.info(`  Unshielded: ${ctx.unshieldedKeystore.getBech32Address()}`);
    logger.info(`  Seed: ${ctx.seedHex}`);
  }

  logger.info('All wallets seeded with DUST.');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
