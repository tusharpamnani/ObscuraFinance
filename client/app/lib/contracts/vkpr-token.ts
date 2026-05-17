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
} from "./vkpr-token/index.js";
import { Contract } from "./vkpr-token/index.js";

export const zkConfigPath = "/contract/vkpr-token";

export function createCompiledVkprTokenContract(coinPublicKey: string) {
  const pk = coinPublicKeyToBytes(coinPublicKey);
  return CompiledContract.make("VkprToken", Contract).pipe(
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
