export const isEmployee = (user: any) => user?.role?.toUpperCase().replace(/\s+/g, '_') === "EMPLOYEE";
export const isManager = (user: any) => user?.role?.toUpperCase().replace(/\s+/g, '_') === "MANAGER";
export const isHRAdmin = (user: any) => user?.role?.toUpperCase().replace(/\s+/g, '_') === "HR_ADMIN" || user?.role?.toUpperCase() === "ADMIN";
export const isFinanceAdmin = (user: any) => user?.role?.toUpperCase().replace(/\s+/g, '_') === "FINANCE" || user?.role?.toUpperCase().replace(/\s+/g, '_') === "FINANCE_ADMIN";
export const isSuperAdmin = (user: any) => user?.role?.toUpperCase().replace(/\s+/g, '_') === "SUPER_ADMIN" || user?.role?.toUpperCase() === "CEO";

export const canApproveLeave = (user: any) => isHRAdmin(user);
export const canIssueReimbursement = (user: any) => isFinanceAdmin(user);
