export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
};
