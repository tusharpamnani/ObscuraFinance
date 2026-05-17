import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  caller(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  ownerKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       to_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  balanceOf(context: __compactRuntime.CircuitContext<PS>, account_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type ProvableCircuits<PS> = {
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       to_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  balanceOf(context: __compactRuntime.CircuitContext<PS>, account_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  transfer(context: __compactRuntime.CircuitContext<PS>,
           to_0: Uint8Array,
           value_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  mint(context: __compactRuntime.CircuitContext<PS>,
       to_0: Uint8Array,
       value_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  balanceOf(context: __compactRuntime.CircuitContext<PS>, account_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: bigint;
  readonly totalSupply: bigint;
  balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly ownerPubKey: Uint8Array;
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
               _name_0: string,
               _symbol_0: string,
               _decimals_0: bigint,
               _owner_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
