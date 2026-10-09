import { ethers } from "ethers";

export const UNISWAP_V4_UNIVERSAL_ROUTER = process.env.UNISWAP_ROUTER_ADDRESS || "0x8876789976dEcBfCbBbe364623C63652db8C0904";
/** Holds every v4 pool's tokens, so it is never a holder and sending tokens to it is a sell. */
export const UNISWAP_V4_POOL_MANAGER = process.env.UNISWAP_POOL_MANAGER || "0x8366a39CC670B4001A1121B8F6A443A643e40951";

export type PoolKey = { fee: number; tickSpacing: number; hooks: string };

const INITIALIZE = ethers.id("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)");
const coder = ethers.AbiCoder.defaultAbiCoder();

/**
 * The ETH pool the curve opened when the token graduated. Anyone can initialize a pool for
 * any token, so only a pool born in a transaction the curve itself took part in counts.
 */
export async function findGraduationPool(provider: ethers.Provider, token: string, curve: string, fromBlock: number): Promise<PoolKey | null> {
  const head = await provider.getBlockNumber();
  const step = 2_000_000;
  for (let from = Math.max(0, fromBlock); from <= head; from += step) {
    const logs = await provider.getLogs({
      address: UNISWAP_V4_POOL_MANAGER,
      topics: [INITIALIZE, null, ethers.zeroPadValue(ethers.ZeroAddress, 32), ethers.zeroPadValue(token, 32)],
      fromBlock: from,
      toBlock: Math.min(head, from + step - 1),
    });
    for (const l of logs) {
      const receipt = await provider.getTransactionReceipt(l.transactionHash);
      if (!receipt?.logs.some((x) => x.address.toLowerCase() === curve.toLowerCase())) continue;
      const [fee, tickSpacing, hooks] = coder.decode(["uint24", "int24", "address", "uint160", "int24"], l.data);
      return { fee: Number(fee), tickSpacing: Number(tickSpacing), hooks: ethers.getAddress(hooks) };
    }
  }
  return null;
}

/**
 * Universal Router calldata that swaps exactly `buyAmountWei` of native ETH for the token in
 * the given pool: V4_SWAP with SWAP_EXACT_IN_SINGLE, SETTLE_ALL (pay the ETH), TAKE_ALL.
 */
export function buildUniswapV4Buy(targetToken: string, buyAmountWei: bigint, key: PoolKey, deadlineSeconds = 1800) {
  const token = ethers.getAddress(targetToken);
  const poolKey = [ethers.ZeroAddress, token, key.fee, key.tickSpacing, key.hooks];
  const swap = coder.encode(
    ["tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,bytes)"],
    [[poolKey, true, buyAmountWei, 1n, "0x"]],
  );
  const settle = coder.encode(["address", "uint256"], [ethers.ZeroAddress, buyAmountWei]);
  const take = coder.encode(["address", "uint256"], [token, 1n]);
  const input = coder.encode(["bytes", "bytes[]"], ["0x060c0f", [swap, settle, take]]);
  const router = new ethers.Interface(["function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable"]);
  return router.encodeFunctionData("execute", ["0x10", [input], Math.floor(Date.now() / 1000) + deadlineSeconds]);
}
