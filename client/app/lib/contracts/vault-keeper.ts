import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { coinPublicKeyToBytes } from "../hex";

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
  type Circuits,
  type Witnesses,
} from "./vault-keeper/index.js";
import { Contract } from "./vault-keeper/index.js";

export const zkConfigPath = "/contract/vault-keeper";

export function createCompiledVaultKeeperContract(coinPublicKey: string) {
  const pk = coinPublicKeyToBytes(coinPublicKey);
  return CompiledContract.make("VaultKeeper", Contract).pipe(
    CompiledContract.withWitnesses({
      caller(ctx: any) {
        return [ctx.currentPrivateState, pk];
      },
      ownerKey(ctx: any) {
        return [ctx.currentPrivateState, pk];
      },
    }),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}
