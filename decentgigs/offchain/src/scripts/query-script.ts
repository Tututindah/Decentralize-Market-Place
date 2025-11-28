import {
  Lucid,
  Blockfrost,
  LucidEvolution,
  validatorToAddress,
  Data,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  NETWORK,
  USDM_UNIT,
} from "../config.js";
import { readValidator, JobDatum } from "../utils.js";

/**
 * Query Script UTxOs
 *
 * This script queries all UTxOs locked at the DecentGigs escrow script address
 * and displays detailed information about each job.
 */
async function queryScriptUtxos() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   🔍 Querying DecentGigs Script UTxOs");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Initialize Lucid
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    // Get script address
    const validator = readValidator();
    const scriptAddress = validatorToAddress(NETWORK, validator);

    console.log(`📍 Script Address: ${scriptAddress}\n`);

    // Query all UTxOs at script address
    const utxos = await lucid.utxosAt(scriptAddress);

    if (utxos.length === 0) {
      console.log("❌ No UTxOs found at script address");
      console.log("   The contract has no active escrows.\n");
      return;
    }

    console.log(`✅ Found ${utxos.length} UTxO(s) at script address:\n`);

    // Display each UTxO
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      console.log(`─────────────────────────────────────────────────`);
      console.log(`📦 UTxO #${i + 1}`);
      console.log(`─────────────────────────────────────────────────`);
      console.log(`   Transaction Hash: ${utxo.txHash}`);
      console.log(`   Output Index:     ${utxo.outputIndex}`);

      // Display assets
      console.log(`\n   💰 Assets:`);
      for (const [unit, amount] of Object.entries(utxo.assets)) {
        if (unit === "lovelace") {
          console.log(`      - ${Number(amount) / 1_000_000} ADA`);
        } else if (unit === USDM_UNIT) {
          console.log(`      - ${Number(amount) / 1_000_000} USDM`);
        } else {
          console.log(`      - ${amount} ${unit.slice(0, 20)}...`);
        }
      }

      // Try to parse datum
      if (utxo.datum) {
        try {
          const datum = Data.from(utxo.datum, JobDatum);
          console.log(`\n   📄 Datum:`);
          console.log(`      Employer PKH:   ${datum.employer}`);
          console.log(`      Freelancer PKH: ${datum.freelancer}`);

          // Try to decode job_id if it's text
          try {
            const jobIdText = Buffer.from(datum.job_id, 'hex').toString('utf8');
            console.log(`      Job ID:         ${jobIdText}`);
          } catch {
            console.log(`      Job ID (hex):   ${datum.job_id}`);
          }
        } catch (error) {
          console.log(`\n   ⚠️  Could not parse datum`);
        }
      } else {
        console.log(`\n   ⚠️  No datum found`);
      }

      console.log();
    }

    // Summary
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`   Total UTxOs: ${utxos.length}`);

    // Calculate total locked value
    const totalAda = utxos.reduce(
      (sum, utxo) => sum + Number(utxo.assets.lovelace || 0n),
      0
    );
    const totalUSDM = utxos.reduce(
      (sum, utxo) => sum + Number(utxo.assets[USDM_UNIT] || 0n),
      0
    );

    console.log(`   Total ADA:   ${totalAda / 1_000_000} ADA`);
    console.log(`   Total USDM:  ${totalUSDM / 1_000_000} USDM`);
    console.log(`═══════════════════════════════════════════════════\n`);

  } catch (error) {
    console.error("\n❌ Error querying script:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  queryScriptUtxos().catch(console.error);
}

export { queryScriptUtxos };
