import { BlockfrostProvider, MeshTxBuilder, MeshWallet, serializePlutusScript, } from "@meshsdk/core";
import { applyParamsToScript } from "@meshsdk/core-cst";
const blockfrost_api_key = "";
const employer_mnemonic = "".split(" ");
const freelancer_mnemonic = "".split(" ");
const wallet_mnemonic = employer_mnemonic;
const blockchainProvider = new BlockfrostProvider(blockfrost_api_key);
export const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet_mnemonic,
    },
});
export async function getWalletInfoForTx() {
    const utxos = await wallet.getUtxos();
    const collateral = (await wallet.getCollateral())[0];
    const walletAddress = await wallet.getChangeAddress();
    if (!utxos || utxos?.length === 0) {
        throw new Error("No utxos found");
    }
    if (!collateral) {
        throw new Error("No collateral found");
    }
    if (!walletAddress) {
        throw new Error("No wallet address found");
    }
    return { utxos, collateral, walletAddress };
}
export function getScript(blueprintCompiledCode, params = [], version = "V3") {
    const scriptCbor = applyParamsToScript(blueprintCompiledCode, params);
    const scriptAddr = serializePlutusScript({ code: scriptCbor, version: version }, undefined, 0).address;
    return { scriptCbor, scriptAddr };
}
export function getTxBuilder() {
    return new MeshTxBuilder({
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
    });
}
export async function getUtxoByTxHash(txHash) {
    const utxos = await blockchainProvider.fetchUTxOs(txHash);
    if (utxos.length === 0) {
        throw new Error("UTxO not found");
    }
    return utxos[0];
}
