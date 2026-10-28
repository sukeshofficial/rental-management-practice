import * as staffProvisioningService from "../services/staffProvisioning.service.js";

/**
 * Controller: Provision staff members via Administrator API
 * Protected by authenticate and requireRole("admin").
 */
export const provisionStaff = async (req, res) => {
  try {
    const {
      staff,
      updateProfile = false,
      rotatePassword = false,
      syncPermissions = false,
      changeRole = false,
      reactivate = false,
    } = req.body;

    if (!staff) {
      return res.status(400).json({
        success: false,
        message: "Missing 'staff' array in request body",
      });
    }

    // Preflight validation: validates entire batch before any DB write
    // Do not allow resolving env vars from API payloads for security
    const validatedStaff = staffProvisioningService.validateStaffBatch(staff, {
      allowPasswordEnvResolution: false,
    });

    const summary = await staffProvisioningService.provisionStaffBatch(validatedStaff, {
      updateProfile: Boolean(updateProfile),
      rotatePassword: Boolean(rotatePassword),
      syncPermissions: Boolean(syncPermissions),
      changeRole: Boolean(changeRole),
      reactivate: Boolean(reactivate),
    });

    return res.status(200).json({
      success: true,
      message: `Staff provisioning complete: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged.`,
      data: summary,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to provision staff",
    });
  }
};
