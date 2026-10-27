/**
 * Customer ownership authorization primitive for rental management resources.
 * Ensures customers can only access their own private resources, while allowing
 * staff/end_users authorized administrative access based on application policy.
 */
export const authorizeOwnership = ({
  resourceOwnerId,
  authenticatedUser,
  allowStaff = true,
}) => {
  if (!authenticatedUser) {
    const error = new Error("Authentication required for resource access");
    error.statusCode = 401;
    throw error;
  }

  // If internal staff is permitted general oversight
  if (allowStaff && authenticatedUser.role === "internal_staff") {
    return true;
  }

  // Normalizing IDs for comparison
  const normalizedOwnerId = resourceOwnerId?.toString?.() || String(resourceOwnerId);
  const normalizedUserId = (authenticatedUser._id || authenticatedUser.id)?.toString?.();

  if (!normalizedOwnerId || !normalizedUserId || normalizedOwnerId !== normalizedUserId) {
    const error = new Error("Access denied: You do not have permission to access this resource");
    error.statusCode = 403;
    throw error;
  }

  return true;
};

/**
 * Filter builder to enforce customer ownership at the database query level.
 * Prevents unauthorized data access directly in MongoDB query criteria.
 */
export const buildOwnershipQuery = (authenticatedUser, baseQuery = {}, ownerField = "customerId") => {
  if (!authenticatedUser) {
    throw new Error("Authentication required to build query filter");
  }

  const userId = authenticatedUser._id || authenticatedUser.id;

  // Customers are strictly scoped to their own records
  if (authenticatedUser.role === "customer") {
    return {
      ...baseQuery,
      [ownerField]: userId,
    };
  }

  // Internal staff may access with the base query unless specific scoping is requested
  return baseQuery;
};
