export const ADMIN_ROLES = new Set(["admin"]);

export const isAdminRole = (role?: string | null) => {
  if (!role) return false;
  return ADMIN_ROLES.has(role);
};
