/**
 * Mesh Utilities for Cardano Smart Contracts
 * Based on Mesh Examples: https://github.com/MeshJS/examples
 */

import {
  BlockfrostProvider,
  MeshTxBuilder,
  serializePlutusScript,
  UTxO,
} from "@meshsdk/core";
import { applyParamsToScript } from "@meshsdk/core-cst";

// Configuration
const BLOCKFROST_API_KEY = import.meta.env.VITE_BLOCKFROST_API_KEY || "preprodHRP2qbfZXQbN1FOMOio2HzZ9VO0vZigh";

const blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY);

/**
 * Get script details from compiled code
 */
export function getScript(
  blueprintCompiledCode: string,
  params: string[] = [],
  version: "V1" | "V2" | "V3" = "V3"
) {
  const scriptCbor = applyParamsToScript(blueprintCompiledCode, params);

  const scriptAddr = serializePlutusScript(
    { code: scriptCbor, version: version },
    undefined,
    0
  ).address;

  return { scriptCbor, scriptAddr };
}

/**
 * Get transaction builder instance
 */
export function getTxBuilder() {
  return new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
  });
}

/**
 * Get UTxO by transaction hash
 */
export async function getUtxoByTxHash(txHash: string): Promise<UTxO> {
  const utxos = await blockchainProvider.fetchUTxOs(txHash);
  if (utxos.length === 0) {
    throw new Error("UTxO not found");
  }
  return utxos[0];
}

/**
 * Get blockchain provider
 */
export function getBlockchainProvider() {
  return blockchainProvider;
}

/**
 * Convert string to hex
 */
export function toHex(str: string): string {
  return Buffer.from(str, "utf-8").toString("hex");
}

/**
 * Convert hex to string
 */
export function fromHex(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf-8");
}

/**
 * Format ADA amount
 */
export function formatAda(lovelace: number): string {
  return (lovelace / 1_000_000).toFixed(6);
}

/**
 * Format USDM amount
 */
export function formatUsdm(amount: number): string {
  return (amount / 1_000_000).toFixed(2);
}

/**
 * Parse ADA to lovelace
 */
export function parseAda(ada: number): number {
  return Math.floor(ada * 1_000_000);
}

/**
 * Parse USDM
 */
export function parseUsdm(usdm: number): number {
  return Math.floor(usdm * 1_000_000);
}
