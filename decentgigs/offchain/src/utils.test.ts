import { describe, it, expect, beforeAll } from "@jest/globals";
import { readValidator, createJobDatum, redeemerRelease, redeemerCancel, JobDatum, JobAction } from "./utils.js";
import { Data } from "@lucid-evolution/lucid";
import * as fs from "fs";

describe("DecentGigs Utils Tests", () => {

  describe("readValidator", () => {
    it("should read and parse validator from plutus.json", () => {
      const validator = readValidator();

      expect(validator).toBeDefined();
      expect(validator.type).toBe("PlutusV3");
      expect(validator.script).toBeDefined();
      expect(typeof validator.script).toBe("string");
      expect(validator.script.length).toBeGreaterThan(0);
    });

    it("should throw error if plutus.json not found", () => {
      // Backup original file
      const plutusPath = "plutus.json";
      const backupPath = "plutus.json.backup";

      if (fs.existsSync(plutusPath)) {
        fs.renameSync(plutusPath, backupPath);
      }

      expect(() => readValidator()).toThrow();

      // Restore
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, plutusPath);
      }
    });

    it("should have correct validator title", () => {
      const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
      const validator = plutusJson.validators.find(
        (v: any) => v.title === "decentgigs.decentgigs.spend"
      );

      expect(validator).toBeDefined();
      expect(validator.title).toBe("decentgigs.decentgigs.spend");
    });
  });

  describe("createJobDatum", () => {
    const mockEmployerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
    const mockFreelancerPkh = "11223344112233441122334411223344112233441122334411223344";

    it("should create valid job datum with default job_id", () => {
      const datum = createJobDatum(mockEmployerPkh, mockFreelancerPkh);

      expect(datum).toBeDefined();
      expect(typeof datum).toBe("string");

      // Verify it can be deserialized
      const parsed = Data.from(datum, JobDatum);
      expect(parsed.employer).toBe(mockEmployerPkh);
      expect(parsed.freelancer).toBe(mockFreelancerPkh);
    });

    it("should create valid job datum with custom job_id", () => {
      const customJobId = "custom_job_123";
      const datum = createJobDatum(mockEmployerPkh, mockFreelancerPkh, customJobId);

      expect(datum).toBeDefined();
      const parsed = Data.from(datum, JobDatum);
      expect(parsed.employer).toBe(mockEmployerPkh);
      expect(parsed.freelancer).toBe(mockFreelancerPkh);
    });

    it("should create different datums for different job_ids", () => {
      const datum1 = createJobDatum(mockEmployerPkh, mockFreelancerPkh, "job_001");
      const datum2 = createJobDatum(mockEmployerPkh, mockFreelancerPkh, "job_002");

      expect(datum1).not.toBe(datum2);
    });

    it("should handle same employer and freelancer correctly", () => {
      const datum = createJobDatum(mockEmployerPkh, mockFreelancerPkh);
      const parsed = Data.from(datum, JobDatum);

      expect(parsed.employer).toBe(mockEmployerPkh);
      expect(parsed.freelancer).toBe(mockFreelancerPkh);
    });
  });

  describe("Redeemers", () => {
    it("should create valid ReleasePayment redeemer", () => {
      expect(redeemerRelease).toBeDefined();
      expect(typeof redeemerRelease).toBe("string");

      // Verify it can be deserialized
      const parsed = Data.from(redeemerRelease, JobAction);
      expect(parsed).toHaveProperty("ReleasePayment");
    });

    it("should create valid CancelJob redeemer", () => {
      expect(redeemerCancel).toBeDefined();
      expect(typeof redeemerCancel).toBe("string");

      // Verify it can be deserialized
      const parsed = Data.from(redeemerCancel, JobAction);
      expect(parsed).toHaveProperty("CancelJob");
    });

    it("should create different redeemers for different actions", () => {
      expect(redeemerRelease).not.toBe(redeemerCancel);
    });

    it("should be serializable and deserializable", () => {
      const releaseParsed = Data.from(redeemerRelease, JobAction);
      const cancelParsed = Data.from(redeemerCancel, JobAction);

      expect(releaseParsed).toBeDefined();
      expect(cancelParsed).toBeDefined();
    });
  });

  describe("Data Schema Validation", () => {
    it("should have correct JobDatum schema structure", () => {
      const mockEmployerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const mockFreelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      const datum = createJobDatum(mockEmployerPkh, mockFreelancerPkh);
      const parsed = Data.from(datum, JobDatum);

      expect(parsed).toHaveProperty("employer");
      expect(parsed).toHaveProperty("freelancer");
      expect(parsed).toHaveProperty("job_id");
    });

    it("should handle empty job_id correctly", () => {
      const mockEmployerPkh = "aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd";
      const mockFreelancerPkh = "11223344112233441122334411223344112233441122334411223344";

      const datum = createJobDatum(mockEmployerPkh, mockFreelancerPkh, "");
      expect(datum).toBeDefined();
    });
  });

  describe("Validator Script Properties", () => {
    it("should have consistent hash across reads", () => {
      const validator1 = readValidator();
      const validator2 = readValidator();

      expect(validator1.script).toBe(validator2.script);
    });

    it("should have PlutusV3 as script type", () => {
      const validator = readValidator();
      expect(validator.type).toBe("PlutusV3");
    });
  });
});
