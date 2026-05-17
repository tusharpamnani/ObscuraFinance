import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  caller(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  ownerKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  setRewardToken(context: __compactRuntime.CircuitContext<PS>,
                 token_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createVault(context: __compactRuntime.CircuitContext<PS>,
              name_0: string,
              riskLevel_0: bigint,
              minAPY_0: bigint,
              maxAPY_0: bigint,
              tokenAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  updateAPY(context: __compactRuntime.CircuitContext<PS>,
            vaultId_0: bigint,
            minAPY_0: bigint,
            maxAPY_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  toggleVaultActive(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          vaultId_0: bigint,
          amount_0: bigint,
          currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           amount_0: bigint,
           currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimRewards(context: __compactRuntime.CircuitContext<PS>,
               currentTime_0: bigint,
               rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  emergencyWithdraw(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  setRewardToken(context: __compactRuntime.CircuitContext<PS>,
                 token_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createVault(context: __compactRuntime.CircuitContext<PS>,
              name_0: string,
              riskLevel_0: bigint,
              minAPY_0: bigint,
              maxAPY_0: bigint,
              tokenAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  updateAPY(context: __compactRuntime.CircuitContext<PS>,
            vaultId_0: bigint,
            minAPY_0: bigint,
            maxAPY_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  toggleVaultActive(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          vaultId_0: bigint,
          amount_0: bigint,
          currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           amount_0: bigint,
           currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimRewards(context: __compactRuntime.CircuitContext<PS>,
               currentTime_0: bigint,
               rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  emergencyWithdraw(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  setRewardToken(context: __compactRuntime.CircuitContext<PS>,
                 token_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createVault(context: __compactRuntime.CircuitContext<PS>,
              name_0: string,
              riskLevel_0: bigint,
              minAPY_0: bigint,
              maxAPY_0: bigint,
              tokenAddress_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  updateAPY(context: __compactRuntime.CircuitContext<PS>,
            vaultId_0: bigint,
            minAPY_0: bigint,
            maxAPY_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  toggleVaultActive(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          vaultId_0: bigint,
          amount_0: bigint,
          currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  withdraw(context: __compactRuntime.CircuitContext<PS>,
           amount_0: bigint,
           currentTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  claimRewards(context: __compactRuntime.CircuitContext<PS>,
               currentTime_0: bigint,
               rewardAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  emergencyWithdraw(context: __compactRuntime.CircuitContext<PS>,
                    vaultId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly vaultCount: bigint;
  readonly ownerPubKey: Uint8Array;
  readonly rewardToken: { is_some: boolean, value: Uint8Array };
  vaultNames: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
  vaultRisks: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  vaultMinAPYs: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  vaultMaxAPYs: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  vaultTVLs: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  vaultTokens: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  vaultActives: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): boolean;
    [Symbol.iterator](): Iterator<[bigint, boolean]>
  };
  userVaults: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  userAmounts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  userTimestamps: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  userRewardsClaimed: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               owner_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
