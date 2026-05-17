import type { MidnightNetworkId } from './midnight-networks';

export interface MidnightContractAddresses {
  vaultKeeper: string;
  vkprToken: string;
}

export const MIDNIGHT_CONTRACTS: Record<MidnightNetworkId, MidnightContractAddresses> = {
  undeployed: {
    vaultKeeper: '',
    vkprToken: '',
  },
  preview: {
    vaultKeeper: '',
    vkprToken: '',
  },
  preprod: {
    vaultKeeper: process.env.NEXT_PUBLIC_VK_ADDRESS || '',
    vkprToken: process.env.NEXT_PUBLIC_VKPR_ADDRESS || '',
  },
  mainnet: {
    vaultKeeper: '',
    vkprToken: '',
  },
};

export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
