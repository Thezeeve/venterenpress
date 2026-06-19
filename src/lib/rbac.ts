import { Role } from "@prisma/client";

export const roleRank: Record<Role, number> = {
  SUPER_ADMIN: 100,
  EDITOR_IN_CHIEF: 90,
  MANAGING_EDITOR: 80,
  JOURNALIST: 70,
  FACT_CHECKER: 60,
  CONTRIBUTOR: 50,
  SUBSCRIBER: 20,
  GUEST_READER: 10,
};

export const permissions = {
  articleCreate: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  articleEdit: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  articleApprove: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  articleFactCheck: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
    Role.FACT_CHECKER,
  ],
  articlePublish: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  articleDelete: [Role.SUPER_ADMIN, Role.EDITOR_IN_CHIEF],
  assignmentManage: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
    Role.JOURNALIST,
  ],
  mediaUpload: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  newsletterManage: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  breakingNewsManage: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ],
  dashboardAccess: [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
    Role.JOURNALIST,
    Role.FACT_CHECKER,
    Role.CONTRIBUTOR,
  ],
} as const;

export type Permission = keyof typeof permissions;

export function hasMinimumRole(role: Role, minimumRole: Role) {
  return roleRank[role] >= roleRank[minimumRole];
}

export function hasPermission(role: Role, permission: Permission) {
  return (permissions[permission] as readonly Role[]).includes(role);
}
