import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type MidnightProvider, type WalletProvider, type FinalizedTxData } from '@midnight-ntwrk/midnight-js-types';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { Buffer } from 'buffer';
import { type Config, vaultKeeperConfig, vkprTokenConfig } from './config';
import type { DeployedContractInstance } from './common-types';

globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

let logger: Logger;

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
  seedHex: string;
}

const signTransactionIntents = (
  tx: { intents?: Map<number, unknown> },
  signFn: (payload: Uint8Array) => ledger.Signature,
  proofMarker: 'proof' | 'pre-proof',
): void => {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize<
      ledger.SignatureEnabled, ledger.Proofish, ledger.PreBinding
    >('signature', proofMarker, 'pre-binding', (intent as any).serialize());
    const signature = signFn(cloned.signatureData(segment));
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: ledger.UtxoSpend, i: number) =>
          cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: ledger.UtxoSpend, i: number) =>
          cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
};

export const createWalletAndMidnightProvider = async (
  ctx: WalletContext,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(
    ctx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)),
  );
  return {
    getCoinPublicKey() {
      return state.shielded.coinPublicKey.toHexString();
    },
    getEncryptionPublicKey() {
      return state.shielded.encryptionPublicKey.toHexString();
    },
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      }
      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx(tx: any) {
      return ctx.wallet.submitTransaction(tx) as any;
    },
  };
};

export const waitForSync = (wallet: WalletFacade, timeoutMs = 600_000) =>
  wallet.state().pipe(
    Rx.throttleTime(10_000),
    Rx.tap((state: any) => {
      if (!state.isSynced) {
        logger.info({
          shieldedApplied: state.shielded?.state?.progress?.appliedIndex?.toString(),
          shieldedHighest: state.shielded?.state?.progress?.highestRelevantWalletIndex?.toString(),
          dustApplied: state.dust?.state?.progress?.appliedIndex?.toString(),
          dustHighest: state.dust?.state?.progress?.highestRelevantWalletIndex?.toString(),
        }, 'Syncing...');
      }
    }),
    Rx.filter((state: any) => state.isSynced),
    Rx.timeout(timeoutMs),
  ).pipe(Rx.firstValueFrom()).catch((err) => {
    logger.warn({ err }, 'waitForSync timed out — continuing anyway');
  });

export const waitForFunds = (wallet: WalletFacade): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.filter((state: any) => state.isSynced),
      Rx.map((s: any) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
      Rx.filter((balance: bigint) => balance > 0n),
    ),
  );

const deriveKeysFromSeed = (seed: string) => {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return result.keys;
};

const registerForDustGeneration = async (
  wallet: WalletFacade,
  unshieldedKeystore: UnshieldedKeystore,
): Promise<void> => {
  const state = await Rx.firstValueFrom(
    wallet.state().pipe(Rx.filter((s: any) => s.isSynced)),
  );
  if (state.dust.availableCoins.length > 0) return;
  const unregistered = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (unregistered.length === 0) {
    const balance = state.unshielded.balances?.[unshieldedToken().raw] ?? 0n;
    if (balance === 0n) {
      logger.warn('No NIGHT balance — skipping DUST registration');
      return;
    }
    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s: any) => s.isSynced),
        Rx.filter((s: any) => s.dust.walletBalance(new Date()) > 0n),
        Rx.timeout(120_000),
      ),
    ).catch(() => {
      logger.warn('DUST registration timed out — continuing');
    });
    return;
  }
  const recipe = await wallet.registerNightUtxosForDustGeneration(
    unregistered,
    unshieldedKeystore.getPublicKey(),
    (payload: Uint8Array) => unshieldedKeystore.signData(payload),
  );
  const finalized = await wallet.finalizeRecipe(recipe);
  await wallet.submitTransaction(finalized);
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s: any) => s.isSynced),
      Rx.filter((s: any) => s.dust.walletBalance(new Date()) > 0n),
      Rx.timeout(120_000),
    ),
  ).catch(() => {
    logger.warn('DUST registration timed out — continuing');
  });
};

export const buildWallet = async (config: Config, seed?: string): Promise<WalletContext> => {
  const seedHex = seed || toHex(Buffer.from(generateRandomSeed()));
  const keys = deriveKeysFromSeed(seedHex);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], config.networkId);

  const relayURL = new URL(config.node.replace(/^http/, 'ws'));

  logger.info('Initializing WalletFacade...');
  let wallet: WalletFacade;
  try {
    wallet = await WalletFacade.init({
      configuration: {
        networkId: config.networkId as any,
        indexerClientConnection: { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS },
        provingServerUrl: new URL(config.proofServer),
        relayURL,
        txHistoryStorage: new InMemoryTransactionHistoryStorage(),
        costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
      },
      shielded: (c: any) => ShieldedWallet(c).startWithSecretKeys(shieldedSecretKeys),
      unshielded: (c: any) => UnshieldedWallet(c).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
      dust: (c: any) => DustWallet(c).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
    });
  } catch (e) {
    logger.error({ err: e }, 'WalletFacade.init failed');
    throw e;
  }

  logger.info('Starting wallet...');
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  logger.info('Waiting for initial sync...');
  await waitForSync(wallet);

  try {
    logger.info('Registering for DUST...');
    await registerForDustGeneration(wallet, unshieldedKeystore);
  } catch (e) {
    logger.warn({ err: e }, 'DUST registration failed — continuing');
  }

  logger.info(`Wallet ready. Unshielded address: ${unshieldedKeystore.getBech32Address()}`);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, seedHex };
};

export const makeVaultKeeperProviders = async (ctx: WalletContext, config: Config) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider(vaultKeeperConfig.zkConfigPath);
  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: vaultKeeperConfig.privateStateStoreName,
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

export const makeVkprTokenProviders = async (ctx: WalletContext, config: Config) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider(vkprTokenConfig.zkConfigPath);
  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: vkprTokenConfig.privateStateStoreName,
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

export function setLogger(l: Logger) {
  logger = l;
}
