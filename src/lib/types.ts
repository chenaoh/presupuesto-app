export type ThemeMode = "system" | "light" | "dark" | "custom";
export type WorkspaceType = "personal" | "shared";
export type MemberRole = "owner" | "member";
export type CategoryKind = "income" | "expense";
export type AccountType =
  | "ahorros"
  | "corriente"
  | "fiduciaria"
  | "billetera"
  | "efectivo"
  | "tarjeta_credito"
  | "otro";
export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "debt_payment"
  | "savings_contribution"
  | "savings_withdrawal";

export interface Profile {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  theme: ThemeMode;
  accentColor: string;
  locale: string;
  currency: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  createdBy: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  usedBy?: string;
  usedAt?: string;
}

export interface Institution {
  id: string;
  workspaceId: string;
  name: string;
  isSystem: boolean;
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  institutionId: string;
  accountType: AccountType;
  initialBalance: number;
  isArchived: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  kind: CategoryKind;
  isSystem: boolean;
  icon: string;
  color: string;
  isArchived: boolean;
}

export interface Budget {
  id: string;
  workspaceId: string;
  categoryId: string;
  periodYear: number;
  periodMonth: number;
  limitAmount: number;
}

export interface Debt {
  id: string;
  workspaceId: string;
  name: string;
  principal: number;
  remaining: number;
  dueDate?: string;
  accountId?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  workspaceId: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
  preferredAccountId?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
  categoryId?: string;
  accountId?: string;
  toAccountId?: string;
  debtId?: string;
  savingsGoalId?: string;
  /** Si es true, aparece fácil de repetir (arriendo, Netflix, etc.). */
  recurring?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AppData {
  profiles: Profile[];
  workspaces: Workspace[];
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  institutions: Institution[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  transactions: Transaction[];
  sessionUserId: string | null;
  activeWorkspaceId: string | null;
}

export const EMPTY_DATA: AppData = {
  profiles: [],
  workspaces: [],
  members: [],
  invites: [],
  institutions: [],
  accounts: [],
  categories: [],
  budgets: [],
  debts: [],
  savingsGoals: [],
  transactions: [],
  sessionUserId: null,
  activeWorkspaceId: null,
};
