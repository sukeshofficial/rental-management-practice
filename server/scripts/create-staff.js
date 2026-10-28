/**
 * Staff Provisioning CLI — create-staff.js
 *
 * Usage:
 *   npm run create:staff -- --file ./scripts/staff.template.json
 *   npm run create:staff -- --file ./scripts/staff.template.json --update-profile
 *   npm run create:staff -- --file ./scripts/staff.template.json --rotate-password
 *   npm run create:staff -- --file ./scripts/staff.template.json --sync-permissions
 *   npm run create:staff -- --file ./scripts/staff.template.json --reactivate
 *
 * The --file path must be a JSON file with a 'staff' array.
 * Each entry may reference a password via 'passwordEnv' (name of env var holding the password).
 * Never pass passwords as command-line arguments.
 *
 * Admin emails (ADMIN_EMAILS in .env) are NOT affected by this script.
 * This script provisions only internal_staff accounts.
 */

import dotenv from "dotenv";
dotenv.config();

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import connectDB from "../src/config/db.js";
import mongoose from "mongoose";
import {
  validateStaffBatch,
  provisionStaffBatch,
} from "../src/services/staffProvisioning.service.js";

/**
 * Remove control characters from log values to prevent log injection.
 */
const sanitizeLogValue = (value) =>
  // eslint-disable-next-line no-control-regex
  String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "");

/**
 * Parse flags from process.argv
 */
const parseArgs = (argv) => {
  const args = argv.slice(2);
  const flags = {
    file: null,
    updateProfile: false,
    rotatePassword: false,
    syncPermissions: false,
    changeRole: false,
    reactivate: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--file" && args[i + 1]) {
      flags.file = args[i + 1];
      i++;
    } else if (arg === "--update-profile") {
      flags.updateProfile = true;
    } else if (arg === "--rotate-password") {
      flags.rotatePassword = true;
    } else if (arg === "--sync-permissions") {
      flags.syncPermissions = true;
    } else if (arg === "--change-role") {
      flags.changeRole = true;
    } else if (arg === "--reactivate") {
      flags.reactivate = true;
    }
  }

  return flags;
};

/**
 * Load and parse JSON staff template from file.
 */
const loadTemplateFile = (filePath) => {
  const absolutePath = resolve(filePath);
  let raw;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (err) {
    throw new Error(`Cannot read file '${absolutePath}': ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    throw new Error(`Invalid JSON in file '${absolutePath}'`, { cause: parseErr });
  }

  if (!parsed || !Array.isArray(parsed.staff)) {
    throw new Error(
      `Template file must have a top-level 'staff' array. Example: { "staff": [ ... ] }`
    );
  }

  return parsed.staff;
};

/**
 * Main execution
 */
const run = async () => {
  const flags = parseArgs(process.argv);

  if (!flags.file) {
    console.error(
      "Error: --file <path> is required.\n" +
        "Usage: npm run create:staff -- --file ./scripts/staff.template.json\n" +
        "Optional flags: --update-profile --rotate-password --sync-permissions --change-role --reactivate"
    );
    process.exitCode = 1;
    return;
  }

  let rawStaffList;
  try {
    rawStaffList = loadTemplateFile(flags.file);
  } catch (err) {
    console.error(`Failed to load template: ${sanitizeLogValue(err.message)}`);
    process.exitCode = 1;
    return;
  }

  // Connect to MongoDB using the existing application database configuration
  try {
    await connectDB();
  } catch (err) {
    console.error(`Database connection failed: ${sanitizeLogValue(err.message)}`);
    process.exitCode = 1;
    return;
  }

  try {
    // Preflight: validate entire batch (resolves passwordEnv from process.env)
    // This throws before any DB write if any record is invalid.
    console.log(`\nRunning preflight validation on ${rawStaffList.length} staff record(s)...`);
    let validatedStaff;
    try {
      validatedStaff = validateStaffBatch(rawStaffList, { allowPasswordEnvResolution: true });
    } catch (err) {
      console.error(`Preflight validation failed: ${sanitizeLogValue(err.message)}`);
      console.error("No database changes were made.");
      process.exitCode = 1;
      return;
    }

    console.log(`Preflight validation passed. Provisioning ${validatedStaff.length} account(s)...`);

    // Provision batch
    const summary = await provisionStaffBatch(validatedStaff, {
      updateProfile: flags.updateProfile,
      rotatePassword: flags.rotatePassword,
      syncPermissions: flags.syncPermissions,
      changeRole: flags.changeRole,
      reactivate: flags.reactivate,
    });

    console.log("\n========================================");
    console.log("  Staff Provisioning Complete");
    console.log("========================================");
    console.log(`  Total processed : ${summary.total}`);
    console.log(`  Created         : ${summary.created}`);
    console.log(`  Updated         : ${summary.updated}`);
    console.log(`  Unchanged       : ${summary.unchanged}`);
    console.log("----------------------------------------");

    summary.results.forEach((result, i) => {
      const actionLabel = {
        created: "✅ CREATED  ",
        updated: "🔄 UPDATED  ",
        unchanged: "⏭  UNCHANGED",
      }[result.action] || result.action;

      console.log(
        `  ${i + 1}. ${actionLabel}  ${sanitizeLogValue(result.email)}` +
          `  [${sanitizeLogValue(result.role)}]` +
          `  status: ${sanitizeLogValue(result.status)}`
      );
    });

    console.log("========================================\n");
    process.exitCode = 0;
  } catch (err) {
    console.error(`Provisioning failed: ${sanitizeLogValue(err.message)}`);
    process.exitCode = 1;
  } finally {
    // Always close the database connection cleanly
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
};

run();
