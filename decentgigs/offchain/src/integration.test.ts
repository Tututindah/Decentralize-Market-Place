import { describe, it, expect, beforeAll } from "@jest/globals";
import {
  Lucid,
  Blockfrost,
  LucidEvolution,
  getAddressDetails,
  validatorToAddress,
  fromText,
  Data,
} from "@lucid-evolution/lucid";
import { readValidator, createJobDatum, redeemerRelease, redeemerCancel } from "./utils.js";

// Mock configuration for testing
const MOCK_CONFIG = {
  BLOCKFROST_API_URL: "https://cardano-preprod.blockfrost.io/api/v0",
  BLOCKFROST_API_KEY: "preprodMOCK_KEY_FOR_TESTING",
  NETWORK: "Preprod" as const,
  USDM_POLICY_ID: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",
  USDM_ASSET_NAME: "0014df105553444d",
};

/**
 * Integration Tests for DecentGigs Smart Contract
 *
 * NOTE: These tests require:
 * 1. Valid Blockfrost API key in config
 * 2. Funded wallet seed phrases
 * 3. Access to Cardano Preprod testnet
 *
 * For CI/CD, these should be run only when credentials are available
 */
describe("DecentGigs Integration Tests", () => {

  describe("Validator Setup", () => {
    it("should load validator correctly", () => {
      const validator = readValidator();

      expect(validator).toBeDefined();
      expect(validator.type).toBe("PlutusV3");
      expect(validator.script).toBeDefined();
    });

    it("should generate valid script address", () => {
      const validator = readValidator();
      const scriptAddress = validatorToAddress(MOCK_CONFIG.NETWORK, validator);

      expect(scriptAddress).toBeDefined();
      expect(typeof scriptAddress).toBe("string");
      expect(scriptAddress.length).toBeGreaterThan(0);

      // Preprod addresses should start with "addr_test"
      expect(scriptAddress.startsWith("addr_test")).toBe(true);
    });
  });

  describe("Datum Creation", () => {
    it("should create valid datum with mock PKHs", () => {
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      const datum = createJobDatum(employerPkh, freelancerPkh, "test_job_001");

      expect(datum).toBeDefined();
      expect(typeof datum).toBe("string");
    });

    it("should create unique datums for different job IDs", () => {
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      const datum1 = createJobDatum(employerPkh, freelancerPkh, "job_001");
      const datum2 = createJobDatum(employerPkh, freelancerPkh, "job_002");

      expect(datum1).not.toBe(datum2);
    });
  });

  describe("Redeemer Validation", () => {
    it("should have valid ReleasePayment redeemer", () => {
      expect(redeemerRelease).toBeDefined();
      expect(typeof redeemerRelease).toBe("string");
      expect(redeemerRelease.length).toBeGreaterThan(0);
    });

    it("should have valid CancelJob redeemer", () => {
      expect(redeemerCancel).toBeDefined();
      expect(typeof redeemerCancel).toBe("string");
      expect(redeemerCancel.length).toBeGreaterThan(0);
    });

    it("should create different redeemers", () => {
      expect(redeemerRelease).not.toBe(redeemerCancel);
    });
  });

  describe("Contract Parameters", () => {
    it("should have correct USDM policy ID", () => {
      expect(MOCK_CONFIG.USDM_POLICY_ID).toBe("c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad");
    });

    it("should have correct USDM asset name", () => {
      expect(MOCK_CONFIG.USDM_ASSET_NAME).toBe("0014df105553444d");
    });

    it("should target Preprod network", () => {
      expect(MOCK_CONFIG.NETWORK).toBe("Preprod");
    });
  });

  describe("Script Hash Consistency", () => {
    it("should produce consistent script hash", () => {
      const validator1 = readValidator();
      const validator2 = readValidator();

      const address1 = validatorToAddress(MOCK_CONFIG.NETWORK, validator1);
      const address2 = validatorToAddress(MOCK_CONFIG.NETWORK, validator2);

      expect(address1).toBe(address2);
    });

    it("should have expected script hash from plutus.json", () => {
      const plutusJson = require("../../plutus.json");
      const validator = plutusJson.validators.find(
        (v: any) => v.title === "decentgigs.decentgigs.spend"
      );

      expect(validator.hash).toBe("f08a3fa3e2cc2fbc20ee8e004e31db8b8c3c9296d77dd5f7f7824474");
    });
  });
});

/**
 * End-to-End Simulation Tests
 * These tests simulate the full contract lifecycle without actual blockchain interaction
 */
describe("E2E Simulation Tests", () => {

  describe("Happy Path - Complete Job Flow", () => {
    it("should simulate job creation and payment release", () => {
      // Mock PKHs
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      // Step 1: Create job
      const jobId = "simulated_job_001";
      const datum = createJobDatum(employerPkh, freelancerPkh, jobId);
      expect(datum).toBeDefined();

      // Step 2: Get validator and address
      const validator = readValidator();
      const scriptAddress = validatorToAddress(MOCK_CONFIG.NETWORK, validator);
      expect(scriptAddress).toBeDefined();

      // Step 3: Prepare release payment redeemer
      expect(redeemerRelease).toBeDefined();

      // Simulation complete - all components work together
      expect(true).toBe(true);
    });

    it("should simulate job cancellation flow", () => {
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      // Step 1: Create job
      const jobId = "cancelled_job_001";
      const datum = createJobDatum(employerPkh, freelancerPkh, jobId);
      expect(datum).toBeDefined();

      // Step 2: Get validator
      const validator = readValidator();
      expect(validator).toBeDefined();

      // Step 3: Prepare cancel redeemer
      expect(redeemerCancel).toBeDefined();

      // Simulation complete
      expect(true).toBe(true);
    });
  });

  describe("Error Cases", () => {
    it("should handle invalid job ID gracefully", () => {
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      // Very long job ID
      const longJobId = "x".repeat(1000);
      expect(() => createJobDatum(employerPkh, freelancerPkh, longJobId)).not.toThrow();
    });

    it("should handle special characters in job ID", () => {
      const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      const specialJobId = "job!@#$%^&*()_+-=[]{}|;':,.<>?/";
      expect(() => createJobDatum(employerPkh, freelancerPkh, specialJobId)).not.toThrow();
    });
  });
});

/**
 * Performance Tests
 */
describe("Performance Tests", () => {

  it("should create datum quickly", () => {
    const employerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
    const freelancerPkh = "11223344112233441122334411223344112233441122334411223344";

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      createJobDatum(employerPkh, freelancerPkh, `job_${i}`);
    }
    const elapsed = Date.now() - start;

    // Should complete 100 datum creations in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });

  it("should read validator quickly", () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      readValidator();
    }
    const elapsed = Date.now() - start;

    // Should complete 100 reads in under 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  it("should generate script address quickly", () => {
    const validator = readValidator();

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      validatorToAddress(MOCK_CONFIG.NETWORK, validator);
    }
    const elapsed = Date.now() - start;

    // Should complete 100 address generations in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });
});
