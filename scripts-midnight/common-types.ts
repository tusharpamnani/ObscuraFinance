import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';

export interface VaultKeeperPrivateState {
  deposits: Map<string, { vaultId: bigint; amount: bigint; timestamp: bigint }>;
}

export const VaultKeeperPrivateStateId = 'vaultKeeperPrivateState';
export const VkprTokenPrivateStateId = 'vkprTokenPrivateState';

export type VaultKeeperCircuits = ProvableCircuitId<any>;
export type VkprTokenCircuits = ProvableCircuitId<any>;

export type VaultKeeperContract = any;
export type VkprTokenContract = any;

export type DeployedContractInstance = DeployedContract<any> | FoundContract<any>;
