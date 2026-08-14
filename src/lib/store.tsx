"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEY } from "./constants";
import { currentPeriod, hashPassword, inPeriod, todayIso, uid } from "./format";
import { seedCategories, seedInstitutions } from "./seeds";
import {
  cloudAcceptInvite,
  cloudCreateInvite,
  cloudCreateSharedWorkspace,
  cloudEnabled,
  cloudLogin,
  cloudLogout,
  cloudRegister,
  cloudUpdateProfile,
  cloudUpdateWorkspace,
  cloudWrite,
  loadCloudData,
  newEntityId,
  writeActiveWorkspaceId,
} from "./supabase/cloud";
import { createClient } from "./supabase/client";
import type {
  Account,
  AccountType,
  AppData,
  Budget,
  Category,
  CategoryKind,
  Debt,
  PaymentMethod,
  Profile,
  SavingsGoal,
  ThemeMode,
  Transaction,
  TransactionType,
  Workspace,
  WorkspaceBudget,
} from "./types";
import { EMPTY_DATA } from "./types";

function makeId(prefix: string) {
  return cloudEnabled() ? newEntityId() : uid(prefix);
}

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
};

type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  categoryId?: string;
  accountId?: string;
  toAccountId?: string;
  debtId?: string;
  savingsGoalId?: string;
  /** Espacio al que corresponde el movimiento (personal o familiar). */
  targetWorkspaceId?: string;
  recurring?: boolean;
  paymentMethod?: PaymentMethod;
};

type AppContextValue = {
  ready: boolean;
  data: AppData;
  user: Profile | null;
  workspace: Workspace | null;
  myWorkspaces: Workspace[];
  register: (input: RegisterInput) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  setActiveWorkspace: (workspaceId: string) => void;
  updateProfile: (
    patch: Partial<Pick<Profile, "displayName" | "theme" | "accentColor" | "avatarData">>,
  ) => void;
  createSharedWorkspace: (name: string) => Promise<string | null>;
  createInvite: () => Promise<string | null>;
  acceptInvite: (code: string) => Promise<string | null>;
  addCategory: (name: string, kind: CategoryKind, color?: string, icon?: string) => string | null;
  updateCategory: (
    id: string,
    patch: Partial<Pick<Category, "name" | "kind" | "color" | "icon">>,
  ) => string | null;
  archiveCategory: (id: string) => void;
  deleteCategory: (id: string) => string | null;
  addInstitution: (name: string) => string | null;
  updateInstitution: (id: string, name: string) => string | null;
  deleteInstitution: (id: string) => string | null;
  addAccount: (input: {
    name: string;
    institutionId: string;
    accountType: AccountType;
    initialBalance: number;
  }) => string | null;
  updateAccount: (
    id: string,
    patch: Partial<Pick<Account, "name" | "institutionId" | "accountType" | "initialBalance">>,
  ) => string | null;
  archiveAccount: (id: string) => void;
  deleteAccount: (id: string) => string | null;
  addTransaction: (input: CreateTransactionInput) => string | null;
  updateTransaction: (id: string, input: CreateTransactionInput) => string | null;
  deleteTransaction: (id: string) => string | null;
  /** Clona un movimiento recurrente; permite ajustar fecha, monto y descripción. */
  repeatTransaction: (
    id: string,
    overrides?: { date?: string; amount?: number; note?: string },
  ) => string | null;
  setTransactionRecurring: (id: string, recurring: boolean) => void;
  upsertBudget: (categoryId: string, limitAmount: number, year?: number, month?: number) => void;
  deleteBudget: (id: string) => void;
  upsertWorkspaceBudget: (limitAmount: number, year?: number, month?: number) => string | null;
  deleteWorkspaceBudget: (id: string) => void;
  /** Aportado al presupuesto del espacio en el periodo (space_contribution). */
  workspaceBudgetFunded: (workspaceId?: string, year?: number, month?: number) => number;
  /** Gastado en el espacio en el periodo (gastos del espacio). */
  workspaceBudgetSpent: (workspaceId?: string, year?: number, month?: number) => number;
  addDebt: (input: { name: string; principal: number; dueDate?: string; accountId?: string }) => string | null;
  updateDebt: (
    id: string,
    patch: Partial<Pick<Debt, "name" | "dueDate" | "accountId" | "remaining">>,
  ) => string | null;
  deleteDebt: (id: string) => string | null;
  addSavingsGoal: (input: {
    name: string;
    targetAmount: number;
    targetDate?: string;
    preferredAccountId?: string;
  }) => string | null;
  updateSavingsGoal: (
    id: string,
    patch: Partial<Pick<SavingsGoal, "name" | "targetAmount" | "targetDate" | "preferredAccountId">>,
  ) => string | null;
  deleteSavingsGoal: (id: string) => string | null;
  renameWorkspace: (id: string, name: string) => string | null;
  updateWorkspace: (
    id: string,
    patch: Partial<Pick<Workspace, "name" | "avatarData" | "accentColor">>,
  ) => string | null;
  deleteWorkspace: (id: string) => string | null;
  accountBalance: (accountId: string) => number;
  goalProgress: (goalId: string) => number;
  spentInCategory: (categoryId: string, year?: number, month?: number) => number;
  personalWorkspace: () => Workspace | null;
  sharedWorkspaces: () => Workspace[];
  categoriesFor: (workspaceId: string, kind?: CategoryKind) => Category[];
  debtsFor: (workspaceId: string) => Debt[];
  goalsFor: (workspaceId: string) => SavingsGoal[];
  /** Cuentas del espacio personal (de dónde sale/entra el dinero). */
  fundingAccounts: () => Account[];
  /** Etiqueta: "Vivienda" personal o "Vivienda (Hogar)" familiar. */
  itemLabel: (workspaceId: string, name: string) => string;
  allCategories: (kind?: CategoryKind) => Category[];
  allDebts: () => Debt[];
  allGoals: () => SavingsGoal[];
  allAccounts: () => Account[];
  allTransactions: () => Transaction[];
  workspaceCategories: (kind?: CategoryKind) => Category[];
  workspaceAccounts: () => Account[];
  workspaceTransactions: () => Transaction[];
  workspaceBudgets: (year?: number, month?: number) => Budget[];
  workspaceDebts: () => Debt[];
  workspaceGoals: () => SavingsGoal[];
  memberName: (userId: string) => string;
  workspaceLabel: (workspaceId: string) => string;
};

const AppContext = createContext<AppContextValue | null>(null);

function loadData(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    return { ...EMPTY_DATA, ...JSON.parse(raw) } as AppData;
  } catch {
    return EMPTY_DATA;
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!cloudEnabled()) {
      setData(loadData());
      setReady(true);
      return;
    }

    const sb = createClient();
    if (!sb) {
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        try {
          const appData = await loadCloudData(
            session.user.id,
            session.user.email ?? "",
          );
          if (!cancelled) setData(appData);
        } catch (err) {
          console.error(err);
        }
      }
      if (!cancelled) setReady(true);
    })();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setData(EMPTY_DATA);
        writeActiveWorkspaceId(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      if (cloudEnabled()) {
        writeActiveWorkspaceId(next.activeWorkspaceId);
      } else {
        saveData(next);
      }
      return next;
    });
  }, []);

  const refreshCloud = useCallback(async () => {
    const sb = createClient();
    if (!sb) return;
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session?.user) return;
    const appData = await loadCloudData(
      session.user.id,
      session.user.email ?? "",
    );
    setData(appData);
  }, []);

  const user = useMemo(
    () => data.profiles.find((p) => p.id === data.sessionUserId) ?? null,
    [data.profiles, data.sessionUserId],
  );

  const myWorkspaces = useMemo(() => {
    if (!user) return [];
    const ids = new Set(
      data.members.filter((m) => m.userId === user.id).map((m) => m.workspaceId),
    );
    return data.workspaces.filter((w) => ids.has(w.id));
  }, [data.members, data.workspaces, user]);

  const workspace = useMemo(() => {
    if (!user) return null;
    const active = myWorkspaces.find((w) => w.id === data.activeWorkspaceId);
    return active ?? myWorkspaces[0] ?? null;
  }, [data.activeWorkspaceId, myWorkspaces, user]);

  const register = useCallback(
    async ({ email, password, displayName }: RegisterInput) => {
      const normalized = email.trim().toLowerCase();
      if (!normalized || !password || !displayName.trim()) {
        return "Completa todos los campos.";
      }

      if (cloudEnabled()) {
        const result = await cloudRegister({ email: normalized, password, displayName });
        if (result.error) return result.error;
        if (result.data) setData(result.data);
        return null;
      }

      if (data.profiles.some((p) => p.email === normalized)) {
        return "Ya existe una cuenta con ese correo.";
      }

      const passwordHash = await hashPassword(password);
      const userId = uid("user");
      const workspaceId = uid("ws");
      const now = new Date().toISOString();
      const institutions = seedInstitutions(workspaceId);
      const categories = seedCategories(workspaceId);

      persist((prev) => ({
        ...prev,
        profiles: [
          ...prev.profiles,
          {
            id: userId,
            email: normalized,
            passwordHash,
            displayName: displayName.trim(),
            theme: "system",
            accentColor: "#1F6B4F",
            locale: "es-CO",
            currency: "COP",
            createdAt: now,
          },
        ],
        workspaces: [
          ...prev.workspaces,
          {
            id: workspaceId,
            name: "Personal",
            type: "personal",
            createdBy: userId,
            createdAt: now,
          },
        ],
        members: [
          ...prev.members,
          {
            id: uid("mem"),
            workspaceId,
            userId,
            role: "owner",
            joinedAt: now,
          },
        ],
        institutions: [...prev.institutions, ...institutions],
        categories: [...prev.categories, ...categories],
        sessionUserId: userId,
        activeWorkspaceId: workspaceId,
      }));

      return null;
    },
    [data.profiles, persist],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (cloudEnabled()) {
        const result = await cloudLogin(email, password);
        if (result.error) return result.error;
        if (result.data) setData(result.data);
        return null;
      }

      const normalized = email.trim().toLowerCase();
      const passwordHash = await hashPassword(password);
      const profile = data.profiles.find(
        (p) => p.email === normalized && p.passwordHash === passwordHash,
      );
      if (!profile) return "Correo o contraseña incorrectos.";

      const personal = data.workspaces.find(
        (w) =>
          w.type === "personal" &&
          data.members.some((m) => m.workspaceId === w.id && m.userId === profile.id),
      );

      persist((prev) => ({
        ...prev,
        sessionUserId: profile.id,
        activeWorkspaceId: personal?.id ?? prev.activeWorkspaceId,
      }));
      return null;
    },
    [data.members, data.profiles, data.workspaces, persist],
  );

  const logout = useCallback(() => {
    if (cloudEnabled()) {
      void cloudLogout();
      setData(EMPTY_DATA);
      return;
    }
    persist((prev) => ({ ...prev, sessionUserId: null, activeWorkspaceId: null }));
  }, [persist]);

  const setActiveWorkspace = useCallback(
    (workspaceId: string) => {
      if (!user) return;
      const allowed = data.members.some(
        (m) => m.userId === user.id && m.workspaceId === workspaceId,
      );
      if (!allowed) return;
      persist((prev) => ({ ...prev, activeWorkspaceId: workspaceId }));
    },
    [data.members, persist, user],
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<Profile, "displayName" | "theme" | "accentColor" | "avatarData">>) => {
      if (!user) return;
      if (cloudEnabled()) void cloudUpdateProfile(user.id, patch);
      persist((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === user.id ? { ...p, ...patch } : p)),
      }));
    },
    [persist, user],
  );

  const createSharedWorkspace = useCallback(
    async (name: string) => {
      if (!user) return "Debes iniciar sesión.";
      const trimmed = name.trim();
      if (!trimmed) return "Escribe un nombre para el espacio familiar.";

      if (cloudEnabled()) {
        const result = await cloudCreateSharedWorkspace(user.id, trimmed);
        if (result.error) return result.error;
        await refreshCloud();
        return null;
      }

      const workspaceId = uid("ws");
      const now = new Date().toISOString();
      const institutions = seedInstitutions(workspaceId);
      const categories = seedCategories(workspaceId);

      persist((prev) => ({
        ...prev,
        workspaces: [
          ...prev.workspaces,
          {
            id: workspaceId,
            name: trimmed,
            type: "shared",
            createdBy: user.id,
            createdAt: now,
          },
        ],
        members: [
          ...prev.members,
          {
            id: uid("mem"),
            workspaceId,
            userId: user.id,
            role: "owner",
            joinedAt: now,
          },
        ],
        institutions: [...prev.institutions, ...institutions],
        categories: [...prev.categories, ...categories],
        activeWorkspaceId: workspaceId,
      }));
      return null;
    },
    [persist, refreshCloud, user],
  );

  const createInvite = useCallback(async () => {
    if (!user || !workspace || workspace.type !== "shared") return null;
    const isMember = data.members.some(
      (m) => m.workspaceId === workspace.id && m.userId === user.id,
    );
    if (!isMember) return null;

    if (cloudEnabled()) {
      const result = await cloudCreateInvite(user.id, workspace.id);
      if (result.error || !result.code) return null;
      await refreshCloud();
      return result.code;
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    persist((prev) => ({
      ...prev,
      invites: [
        ...prev.invites,
        {
          id: uid("inv"),
          workspaceId: workspace.id,
          code,
          createdBy: user.id,
          expiresAt,
        },
      ],
    }));
    return code;
  }, [data.members, persist, refreshCloud, user, workspace]);

  const acceptInvite = useCallback(
    async (code: string) => {
      if (!user) return "Debes iniciar sesión.";

      if (cloudEnabled()) {
        const result = await cloudAcceptInvite(code);
        if (result.error) return result.error;
        await refreshCloud();
        return null;
      }

      const invite = data.invites.find(
        (i) => i.code.toUpperCase() === code.trim().toUpperCase() && !i.usedBy,
      );
      if (!invite) return "Código inválido.";
      if (new Date(invite.expiresAt).getTime() < Date.now()) return "El código expiró.";
      if (data.members.some((m) => m.workspaceId === invite.workspaceId && m.userId === user.id)) {
        return "Ya perteneces a este espacio.";
      }

      persist((prev) => ({
        ...prev,
        members: [
          ...prev.members,
          {
            id: uid("mem"),
            workspaceId: invite.workspaceId,
            userId: user.id,
            role: "member",
            joinedAt: new Date().toISOString(),
          },
        ],
        invites: prev.invites.map((i) =>
          i.id === invite.id
            ? { ...i, usedBy: user.id, usedAt: new Date().toISOString() }
            : i,
        ),
        activeWorkspaceId: invite.workspaceId,
      }));
      return null;
    },
    [data.invites, data.members, persist, refreshCloud, user],
  );

  const addCategory = useCallback(
    (name: string, kind: CategoryKind, color = "#64748B", icon = "Tag") => {
      if (!workspace) return "Selecciona un espacio.";
      const trimmed = name.trim();
      if (!trimmed) return "Escribe un nombre.";
      const id = makeId("cat");
      const iconName = icon.trim() || "Tag";
      persist((prev) => ({
        ...prev,
        categories: [
          ...prev.categories,
          {
            id,
            workspaceId: workspace.id,
            name: trimmed,
            kind,
            isSystem: false,
            icon: iconName,
            color,
            isArchived: false,
          },
        ],
      }));
      cloudWrite(() =>
        createClient()!.from("categories").insert({
          id,
          workspace_id: workspace.id,
          name: trimmed,
          kind,
          is_system: false,
          icon: iconName,
          color,
          is_archived: false,
        }),
      );
      return null;
    },
    [persist, workspace],
  );

  const archiveCategory = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id ? { ...c, isArchived: true } : c,
        ),
      }));
      cloudWrite(() =>
        createClient()!.from("categories").update({ is_archived: true }).eq("id", id),
      );
    },
    [persist],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Pick<Category, "name" | "kind" | "color" | "icon">>) => {
      const cat = data.categories.find((c) => c.id === id);
      if (!cat) return "Categoría no encontrada.";
      const name = patch.name?.trim();
      if (patch.name !== undefined && !name) return "El nombre no puede estar vacío.";
      persist((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                name: name ?? c.name,
                icon: patch.icon !== undefined ? patch.icon.trim() || "Tag" : c.icon,
              }
            : c,
        ),
      }));
      cloudWrite(() =>
        createClient()!
          .from("categories")
          .update({
            ...(name !== undefined ? { name } : {}),
            ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
            ...(patch.color !== undefined ? { color: patch.color } : {}),
            ...(patch.icon !== undefined ? { icon: patch.icon.trim() || "Tag" } : {}),
          })
          .eq("id", id),
      );
      return null;
    },
    [data.categories, persist],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const linked = data.transactions.some((t) => t.categoryId === id);
      const budgetLinked = data.budgets.some((b) => b.categoryId === id);
      if (linked || budgetLinked) {
        persist((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === id ? { ...c, isArchived: true } : c,
          ),
          budgets: prev.budgets.filter((b) => b.categoryId !== id),
        }));
        cloudWrite(() =>
          createClient()!.from("categories").update({ is_archived: true }).eq("id", id),
        );
        return null;
      }
      persist((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
      }));
      cloudWrite(() => createClient()!.from("categories").delete().eq("id", id));
      return null;
    },
    [data.budgets, data.transactions, persist],
  );

  const addInstitution = useCallback(
    (name: string) => {
      if (!workspace) return "Selecciona un espacio.";
      const trimmed = name.trim();
      if (!trimmed) return "Escribe un nombre.";
      const id = makeId("inst");
      persist((prev) => ({
        ...prev,
        institutions: [
          ...prev.institutions,
          {
            id,
            workspaceId: workspace.id,
            name: trimmed,
            isSystem: false,
          },
        ],
      }));
      cloudWrite(() =>
        createClient()!.from("institutions").insert({
          id,
          workspace_id: workspace.id,
          name: trimmed,
          is_system: false,
        }),
      );
      return null;
    },
    [persist, workspace],
  );

  const updateInstitution = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return "Escribe un nombre.";
      const inst = data.institutions.find((i) => i.id === id);
      if (!inst) return "Institución no encontrada.";
      persist((prev) => ({
        ...prev,
        institutions: prev.institutions.map((i) =>
          i.id === id ? { ...i, name: trimmed } : i,
        ),
      }));
      cloudWrite(() =>
        createClient()!.from("institutions").update({ name: trimmed }).eq("id", id),
      );
      return null;
    },
    [data.institutions, persist],
  );

  const deleteInstitution = useCallback(
    (id: string) => {
      const linked = data.accounts.some((a) => a.institutionId === id);
      if (linked) {
        return "No se puede eliminar: hay cuentas asociadas. Cámbialas o elimínalas primero.";
      }
      persist((prev) => ({
        ...prev,
        institutions: prev.institutions.filter((i) => i.id !== id),
      }));
      cloudWrite(() => createClient()!.from("institutions").delete().eq("id", id));
      return null;
    },
    [data.accounts, persist],
  );

  const addAccount = useCallback(
    (input: {
      name: string;
      institutionId: string;
      accountType: AccountType;
      initialBalance: number;
    }) => {
      if (!workspace) return "Selecciona un espacio.";
      if (!input.name.trim()) return "Escribe un nombre para la cuenta.";
      if (!input.institutionId) {
        return "Selecciona una institución. Créala antes en Instituciones.";
      }
      const inst = data.institutions.find(
        (i) => i.id === input.institutionId && i.workspaceId === workspace.id,
      );
      if (!inst) return "Institución no válida para este espacio.";
      const id = makeId("acc");
      const createdAt = new Date().toISOString();
      persist((prev) => ({
        ...prev,
        accounts: [
          ...prev.accounts,
          {
            id,
            workspaceId: workspace.id,
            name: input.name.trim(),
            institutionId: input.institutionId,
            accountType: input.accountType,
            initialBalance: input.initialBalance || 0,
            isArchived: false,
            createdAt,
          },
        ],
      }));
      cloudWrite(() =>
        createClient()!.from("accounts").insert({
          id,
          workspace_id: workspace.id,
          name: input.name.trim(),
          institution_id: input.institutionId,
          account_type: input.accountType,
          initial_balance: input.initialBalance || 0,
          is_archived: false,
          created_at: createdAt,
        }),
      );
      return null;
    },
    [data.institutions, persist, workspace],
  );

  const archiveAccount = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === id ? { ...a, isArchived: true } : a,
        ),
      }));
      cloudWrite(() =>
        createClient()!.from("accounts").update({ is_archived: true }).eq("id", id),
      );
    },
    [persist],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      const linked = data.transactions.some(
        (t) => t.accountId === id || t.toAccountId === id,
      );
      if (linked) {
        return "No se puede eliminar: la cuenta tiene movimientos. Archívala o bórralos antes.";
      }
      const linkedDebt = data.debts.some((d) => d.accountId === id);
      const linkedGoal = data.savingsGoals.some((g) => g.preferredAccountId === id);
      if (linkedDebt || linkedGoal) {
        return "No se puede eliminar: está asociada a una deuda o meta. Quita la asociación primero.";
      }
      persist((prev) => ({
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
      }));
      cloudWrite(() => createClient()!.from("accounts").delete().eq("id", id));
      return null;
    },
    [data.debts, data.savingsGoals, data.transactions, persist],
  );

  const updateAccount = useCallback(
    (
      id: string,
      patch: Partial<Pick<Account, "name" | "institutionId" | "accountType" | "initialBalance">>,
    ) => {
      const acc = data.accounts.find((a) => a.id === id);
      if (!acc) return "Cuenta no encontrada.";
      if (patch.name !== undefined && !patch.name.trim()) return "Nombre inválido.";
      persist((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === id
            ? {
                ...a,
                ...patch,
                name: patch.name?.trim() ?? a.name,
              }
            : a,
        ),
      }));
      cloudWrite(() =>
        createClient()!
          .from("accounts")
          .update({
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.institutionId !== undefined
              ? { institution_id: patch.institutionId }
              : {}),
            ...(patch.accountType !== undefined ? { account_type: patch.accountType } : {}),
            ...(patch.initialBalance !== undefined
              ? { initial_balance: patch.initialBalance }
              : {}),
          })
          .eq("id", id),
      );
      return null;
    },
    [data.accounts, persist],
  );

  const personalWorkspace = useCallback(() => {
    if (!user) return null;
    return (
      myWorkspaces.find((w) => w.type === "personal") ??
      null
    );
  }, [myWorkspaces, user]);

  const sharedWorkspaces = useCallback(() => {
    return myWorkspaces.filter((w) => w.type === "shared");
  }, [myWorkspaces]);

  const categoriesFor = useCallback(
    (workspaceId: string, kind?: CategoryKind) =>
      data.categories.filter(
        (c) =>
          c.workspaceId === workspaceId &&
          !c.isArchived &&
          (kind ? c.kind === kind : true),
      ),
    [data.categories],
  );

  const debtsFor = useCallback(
    (workspaceId: string) =>
      data.debts.filter((d) => d.workspaceId === workspaceId && !d.isArchived),
    [data.debts],
  );

  const goalsFor = useCallback(
    (workspaceId: string) =>
      data.savingsGoals.filter((g) => g.workspaceId === workspaceId && !g.isArchived),
    [data.savingsGoals],
  );

  const fundingAccounts = useCallback(() => {
    const personal = personalWorkspace();
    const sourceId = personal?.id ?? workspace?.id;
    if (!sourceId) return [];
    return data.accounts.filter((a) => a.workspaceId === sourceId && !a.isArchived);
  }, [data.accounts, personalWorkspace, workspace?.id]);

  const workspaceLabel = useCallback(
    (workspaceId: string) => {
      const w = data.workspaces.find((x) => x.id === workspaceId);
      if (!w) return "Espacio";
      return w.type === "personal" ? `${w.name} (Personal)` : `${w.name} (Familiar)`;
    },
    [data.workspaces],
  );

  const itemLabel = useCallback(
    (workspaceId: string, name: string) => {
      const w = data.workspaces.find((x) => x.id === workspaceId);
      if (!w || w.type === "personal") return name;
      return `${name} (${w.name})`;
    },
    [data.workspaces],
  );

  const allCategories = useCallback(
    (kind?: CategoryKind) => {
      const ids = new Set(myWorkspaces.map((w) => w.id));
      return data.categories
        .filter(
          (c) =>
            ids.has(c.workspaceId) &&
            !c.isArchived &&
            (kind ? c.kind === kind : true),
        )
        .sort((a, b) => itemLabel(a.workspaceId, a.name).localeCompare(itemLabel(b.workspaceId, b.name), "es"));
    },
    [data.categories, itemLabel, myWorkspaces],
  );

  const allDebts = useCallback(() => {
    const ids = new Set(myWorkspaces.map((w) => w.id));
    return data.debts
      .filter((d) => ids.has(d.workspaceId) && !d.isArchived)
      .sort((a, b) => itemLabel(a.workspaceId, a.name).localeCompare(itemLabel(b.workspaceId, b.name), "es"));
  }, [data.debts, itemLabel, myWorkspaces]);

  const allGoals = useCallback(() => {
    const ids = new Set(myWorkspaces.map((w) => w.id));
    return data.savingsGoals
      .filter((g) => ids.has(g.workspaceId) && !g.isArchived)
      .sort((a, b) => itemLabel(a.workspaceId, a.name).localeCompare(itemLabel(b.workspaceId, b.name), "es"));
  }, [data.savingsGoals, itemLabel, myWorkspaces]);

  const allAccounts = useCallback(() => {
    const ids = new Set(myWorkspaces.map((w) => w.id));
    return data.accounts
      .filter((a) => ids.has(a.workspaceId) && !a.isArchived)
      .sort((a, b) => itemLabel(a.workspaceId, a.name).localeCompare(itemLabel(b.workspaceId, b.name), "es"));
  }, [data.accounts, itemLabel, myWorkspaces]);

  const allTransactions = useCallback(() => {
    const ids = new Set(myWorkspaces.map((w) => w.id));
    return data.transactions
      .filter((t) => ids.has(t.workspaceId))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data.transactions, myWorkspaces]);

  const addTransaction = useCallback(
    (input: CreateTransactionInput) => {
      if (!user) return "Sesión inválida.";
      const funding = data.accounts.filter((a) => !a.isArchived);
      if (funding.length === 0) {
        return "Primero crea al menos una cuenta en Cuentas.";
      }
      const personal = myWorkspaces.find((w) => w.type === "personal");
      const targetId = input.targetWorkspaceId || workspace?.id || personal?.id;
      if (!targetId) return "Selecciona a qué espacio corresponde el movimiento.";

      const allowed = data.members.some(
        (m) => m.userId === user.id && m.workspaceId === targetId,
      );
      if (!allowed) return "No tienes acceso a ese espacio.";

      if (!input.amount || input.amount <= 0) return "El monto debe ser mayor a 0.";

      if (input.type === "transfer" && (!input.accountId || !input.toAccountId)) {
        return "Selecciona cuenta origen y destino.";
      }
      if (
        (input.type === "income" || input.type === "expense") &&
        (!input.categoryId || !input.accountId)
      ) {
        return "Categoría y cuenta son obligatorias.";
      }
      if (input.type === "debt_payment" && (!input.debtId || !input.accountId)) {
        return "Selecciona la deuda y la cuenta.";
      }
      if (
        (input.type === "savings_contribution" || input.type === "savings_withdrawal") &&
        (!input.savingsGoalId || !input.accountId)
      ) {
        return "Selecciona la meta y la cuenta.";
      }
      if (input.type === "space_contribution") {
        if (!input.accountId) return "Selecciona tu cuenta personal para el aporte.";
        const targetWs = data.workspaces.find((w) => w.id === targetId);
        if (!targetWs || targetWs.type !== "shared") {
          return "El aporte solo aplica a un espacio familiar.";
        }
        const acc = data.accounts.find((a) => a.id === input.accountId);
        if (!personal || !acc || acc.workspaceId !== personal.id) {
          return "El aporte debe salir de una cuenta de tu espacio personal.";
        }
      }

      if (input.categoryId) {
        const cat = data.categories.find((c) => c.id === input.categoryId);
        if (!cat || cat.workspaceId !== targetId) {
          return "La categoría no pertenece al espacio seleccionado.";
        }
      }
      if (input.debtId) {
        const debt = data.debts.find((d) => d.id === input.debtId);
        if (!debt || debt.workspaceId !== targetId) {
          return "La deuda no pertenece al espacio seleccionado.";
        }
      }
      if (input.savingsGoalId) {
        const goal = data.savingsGoals.find((g) => g.id === input.savingsGoalId);
        if (!goal || goal.workspaceId !== targetId) {
          return "La meta no pertenece al espacio seleccionado.";
        }
      }

      const tx: Transaction = {
        id: makeId("tx"),
        workspaceId: targetId,
        type: input.type,
        amount: Math.round(input.amount),
        date: input.date || todayIso(),
        note: input.note?.trim() || "",
        categoryId: input.categoryId,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        debtId: input.debtId,
        savingsGoalId: input.savingsGoalId,
        recurring: Boolean(input.recurring),
        paymentMethod: input.paymentMethod,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };

      persist((prev) => {
        let debts = prev.debts;
        if (tx.type === "debt_payment" && tx.debtId) {
          debts = debts.map((d) =>
            d.id === tx.debtId
              ? { ...d, remaining: Math.max(0, d.remaining - tx.amount) }
              : d,
          );
        }
        return {
          ...prev,
          transactions: [tx, ...prev.transactions],
          debts,
        };
      });
      cloudWrite(async () => {
        const sb = createClient()!;
        const insertRes = await sb.from("transactions").insert({
          id: tx.id,
          workspace_id: tx.workspaceId,
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          note: tx.note,
          category_id: tx.categoryId ?? null,
          account_id: tx.accountId ?? null,
          to_account_id: tx.toAccountId ?? null,
          debt_id: tx.debtId ?? null,
          savings_goal_id: tx.savingsGoalId ?? null,
          recurring: Boolean(tx.recurring),
          payment_method: tx.paymentMethod ?? null,
          created_by: tx.createdBy,
          created_at: tx.createdAt,
        });
        if (insertRes.error) return insertRes;
        if (tx.type === "debt_payment" && tx.debtId) {
          const debt = data.debts.find((d) => d.id === tx.debtId);
          if (debt) {
            return sb
              .from("debts")
              .update({ remaining: Math.max(0, debt.remaining - tx.amount) })
              .eq("id", tx.debtId);
          }
        }
        return insertRes;
      });
      return null;
    },
    [data.accounts, data.categories, data.debts, data.members, data.savingsGoals, data.workspaces, myWorkspaces, persist, user, workspace?.id],
  );

  const updateTransaction = useCallback(
    (id: string, input: CreateTransactionInput) => {
      if (!user) return "Sesión inválida.";
      const existing = data.transactions.find((t) => t.id === id);
      if (!existing) return "Movimiento no encontrado.";
      if (existing.createdBy !== user.id) {
        return "Solo puedes editar movimientos que creaste tú.";
      }

      const personal = myWorkspaces.find((w) => w.type === "personal");
      const targetId = input.targetWorkspaceId || existing.workspaceId || personal?.id;
      if (!targetId) return "Selecciona a qué espacio corresponde el movimiento.";

      const allowed = data.members.some(
        (m) => m.userId === user.id && m.workspaceId === targetId,
      );
      if (!allowed) return "No tienes acceso a ese espacio.";
      if (!input.amount || input.amount <= 0) return "El monto debe ser mayor a 0.";

      if (input.type === "transfer" && (!input.accountId || !input.toAccountId)) {
        return "Selecciona cuenta origen y destino.";
      }
      if (
        (input.type === "income" || input.type === "expense") &&
        (!input.categoryId || !input.accountId)
      ) {
        return "Categoría y cuenta son obligatorias.";
      }
      if (input.type === "debt_payment" && (!input.debtId || !input.accountId)) {
        return "Selecciona la deuda y la cuenta.";
      }
      if (
        (input.type === "savings_contribution" || input.type === "savings_withdrawal") &&
        (!input.savingsGoalId || !input.accountId)
      ) {
        return "Selecciona la meta y la cuenta.";
      }

      if (input.categoryId) {
        const cat = data.categories.find((c) => c.id === input.categoryId);
        if (!cat || cat.workspaceId !== targetId) {
          return "La categoría no pertenece al espacio seleccionado.";
        }
      }
      if (input.debtId) {
        const debt = data.debts.find((d) => d.id === input.debtId);
        if (!debt || debt.workspaceId !== targetId) {
          return "La deuda no pertenece al espacio seleccionado.";
        }
      }
      if (input.savingsGoalId) {
        const goal = data.savingsGoals.find((g) => g.id === input.savingsGoalId);
        if (!goal || goal.workspaceId !== targetId) {
          return "La meta no pertenece al espacio seleccionado.";
        }
      }

      const next: Transaction = {
        ...existing,
        workspaceId: targetId,
        type: input.type,
        amount: Math.round(input.amount),
        date: input.date || existing.date,
        note: input.note?.trim() || "",
        categoryId: input.categoryId,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        debtId: input.debtId,
        savingsGoalId: input.savingsGoalId,
        recurring: Boolean(input.recurring),
        paymentMethod: input.paymentMethod,
      };

      persist((prev) => {
        let debts = prev.debts;
        if (existing.type === "debt_payment" && existing.debtId) {
          debts = debts.map((d) =>
            d.id === existing.debtId
              ? { ...d, remaining: d.remaining + existing.amount }
              : d,
          );
        }
        if (next.type === "debt_payment" && next.debtId) {
          debts = debts.map((d) =>
            d.id === next.debtId
              ? { ...d, remaining: Math.max(0, d.remaining - next.amount) }
              : d,
          );
        }
        return {
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === id ? next : t)),
          debts,
        };
      });
      cloudWrite(() =>
        createClient()!
          .from("transactions")
          .update({
            workspace_id: next.workspaceId,
            type: next.type,
            amount: next.amount,
            date: next.date,
            note: next.note,
            category_id: next.categoryId ?? null,
            account_id: next.accountId ?? null,
            to_account_id: next.toAccountId ?? null,
            debt_id: next.debtId ?? null,
            savings_goal_id: next.savingsGoalId ?? null,
            recurring: Boolean(next.recurring),
            payment_method: next.paymentMethod ?? null,
          })
          .eq("id", id),
      );
      return null;
    },
    [
      data.categories,
      data.debts,
      data.members,
      data.savingsGoals,
      data.transactions,
      myWorkspaces,
      persist,
      user,
    ],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!user) return "Sesión inválida.";
      const tx = data.transactions.find((t) => t.id === id);
      if (!tx) return "Movimiento no encontrado.";
      if (tx.createdBy !== user.id) {
        return "Solo puedes eliminar movimientos que creaste tú.";
      }
      persist((prev) => {
        const current = prev.transactions.find((t) => t.id === id);
        let debts = prev.debts;
        if (current?.type === "debt_payment" && current.debtId) {
          debts = debts.map((d) =>
            d.id === current.debtId
              ? { ...d, remaining: d.remaining + current.amount }
              : d,
          );
        }
        return {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
          debts,
        };
      });
      cloudWrite(() => createClient()!.from("transactions").delete().eq("id", id));
      return null;
    },
    [data.transactions, persist, user],
  );

  const setTransactionRecurring = useCallback(
    (id: string, recurring: boolean) => {
      persist((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, recurring } : t,
        ),
      }));
      cloudWrite(() =>
        createClient()!.from("transactions").update({ recurring }).eq("id", id),
      );
    },
    [persist],
  );

  const repeatTransaction = useCallback(
    (id: string, overrides?: { date?: string; amount?: number; note?: string }) => {
      if (!user) return "Sesión inválida.";
      const original = data.transactions.find((t) => t.id === id);
      if (!original) return "Movimiento no encontrado.";

      const amount = overrides?.amount ?? original.amount;
      if (!amount || amount <= 0) return "El monto debe ser mayor a 0.";

      return addTransaction({
        type: original.type,
        amount,
        date: overrides?.date || todayIso(),
        note: overrides?.note !== undefined ? overrides.note : original.note,
        categoryId: original.categoryId,
        accountId: original.accountId,
        toAccountId: original.toAccountId,
        debtId: original.debtId,
        savingsGoalId: original.savingsGoalId,
        targetWorkspaceId: original.workspaceId,
        recurring: original.recurring ?? true,
        paymentMethod: original.paymentMethod,
      });
    },
    [addTransaction, data.transactions, user],
  );

  const upsertBudget = useCallback(
    (categoryId: string, limitAmount: number, year?: number, month?: number) => {
      const cat = data.categories.find((c) => c.id === categoryId);
      const wsId = cat?.workspaceId ?? workspace?.id;
      if (!wsId) return;
      if (cat && workspace && cat.workspaceId !== workspace.id) return;
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      const amount = Math.round(limitAmount);
      let budgetId = "";
      persist((prev) => {
        const existing = prev.budgets.find(
          (b) =>
            b.workspaceId === wsId &&
            b.categoryId === categoryId &&
            b.periodYear === y &&
            b.periodMonth === m,
        );
        if (existing) {
          budgetId = existing.id;
          return {
            ...prev,
            budgets: prev.budgets.map((b) =>
              b.id === existing.id ? { ...b, limitAmount: amount } : b,
            ),
          };
        }
        budgetId = uid("bud");
        return {
          ...prev,
          budgets: [
            ...prev.budgets,
            {
              id: budgetId,
              workspaceId: wsId,
              categoryId,
              periodYear: y,
              periodMonth: m,
              limitAmount: amount,
            },
          ],
        };
      });
      cloudWrite(() => {
        const sb = createClient()!;
        if (!budgetId) return Promise.resolve({ error: null });
        return sb.from("budgets").upsert({
          id: budgetId,
          workspace_id: wsId,
          category_id: categoryId,
          period_year: y,
          period_month: m,
          limit_amount: amount,
        });
      });
    },
    [data.categories, persist, workspace],
  );

  const deleteBudget = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        budgets: prev.budgets.filter((b) => b.id !== id),
      }));
      cloudWrite(() => createClient()!.from("budgets").delete().eq("id", id));
    },
    [persist],
  );

  const upsertWorkspaceBudget = useCallback(
    (limitAmount: number, year?: number, month?: number) => {
      if (!workspace) return "Selecciona un espacio.";
      if (workspace.type !== "shared") {
        return "El presupuesto de espacio solo aplica a espacios familiares.";
      }
      if (!limitAmount || limitAmount < 0) return "Monto inválido.";
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      const amount = Math.round(limitAmount);
      let budgetId = "";
      persist((prev) => {
        const list = prev.workspaceBudgets ?? [];
        const existing = list.find(
          (b) => b.workspaceId === workspace.id && b.periodYear === y && b.periodMonth === m,
        );
        if (existing) {
          budgetId = existing.id;
          return {
            ...prev,
            workspaceBudgets: list.map((b) =>
              b.id === existing.id ? { ...b, limitAmount: amount } : b,
            ),
          };
        }
        budgetId = makeId("wbud");
        return {
          ...prev,
          workspaceBudgets: [
            ...list,
            {
              id: budgetId,
              workspaceId: workspace.id,
              periodYear: y,
              periodMonth: m,
              limitAmount: amount,
            } satisfies WorkspaceBudget,
          ],
        };
      });
      cloudWrite(() =>
        createClient()!.from("workspace_budgets").upsert({
          id: budgetId,
          workspace_id: workspace.id,
          period_year: y,
          period_month: m,
          limit_amount: amount,
        }),
      );
      return null;
    },
    [persist, workspace],
  );

  const deleteWorkspaceBudget = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        workspaceBudgets: (prev.workspaceBudgets ?? []).filter((b) => b.id !== id),
      }));
      cloudWrite(() => createClient()!.from("workspace_budgets").delete().eq("id", id));
    },
    [persist],
  );

  const workspaceBudgetFunded = useCallback(
    (workspaceId?: string, year?: number, month?: number) => {
      const wsId = workspaceId ?? workspace?.id;
      if (!wsId) return 0;
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      return data.transactions
        .filter(
          (t) =>
            t.workspaceId === wsId &&
            t.type === "space_contribution" &&
            inPeriod(t.date, y, m),
        )
        .reduce((s, t) => s + t.amount, 0);
    },
    [data.transactions, workspace?.id],
  );

  const workspaceBudgetSpent = useCallback(
    (workspaceId?: string, year?: number, month?: number) => {
      const wsId = workspaceId ?? workspace?.id;
      if (!wsId) return 0;
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      return data.transactions
        .filter(
          (t) =>
            t.workspaceId === wsId &&
            (t.type === "expense" || t.type === "debt_payment") &&
            inPeriod(t.date, y, m),
        )
        .reduce((s, t) => s + t.amount, 0);
    },
    [data.transactions, workspace?.id],
  );

  const addDebt = useCallback(
    (input: { name: string; principal: number; dueDate?: string; accountId?: string }) => {
      if (!workspace) return "Selecciona un espacio.";
      if (!input.name.trim() || input.principal <= 0) return "Datos de deuda inválidos.";
      const id = makeId("debt");
      const createdAt = new Date().toISOString();
      const principal = Math.round(input.principal);
      persist((prev) => ({
        ...prev,
        debts: [
          ...prev.debts,
          {
            id,
            workspaceId: workspace.id,
            name: input.name.trim(),
            principal,
            remaining: principal,
            dueDate: input.dueDate || undefined,
            accountId: input.accountId,
            isArchived: false,
            createdAt,
          },
        ],
      }));
      cloudWrite(() =>
        createClient()!.from("debts").insert({
          id,
          workspace_id: workspace.id,
          name: input.name.trim(),
          principal,
          remaining: principal,
          due_date: input.dueDate || null,
          account_id: input.accountId ?? null,
          is_archived: false,
          created_at: createdAt,
        }),
      );
      return null;
    },
    [persist, workspace],
  );

  const updateDebt = useCallback(
    (id: string, patch: Partial<Pick<Debt, "name" | "dueDate" | "accountId" | "remaining">>) => {
      if (!data.debts.some((d) => d.id === id)) return "Deuda no encontrada.";
      if (patch.name !== undefined && !patch.name.trim()) return "Nombre inválido.";
      persist((prev) => ({
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === id
            ? {
                ...d,
                ...patch,
                name: patch.name?.trim() ?? d.name,
              }
            : d,
        ),
      }));
      cloudWrite(() =>
        createClient()!
          .from("debts")
          .update({
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.dueDate !== undefined ? { due_date: patch.dueDate || null } : {}),
            ...(patch.accountId !== undefined ? { account_id: patch.accountId ?? null } : {}),
            ...(patch.remaining !== undefined ? { remaining: patch.remaining } : {}),
          })
          .eq("id", id),
      );
      return null;
    },
    [data.debts, persist],
  );

  const deleteDebt = useCallback(
    (id: string) => {
      const linked = data.transactions.some((t) => t.debtId === id);
      if (linked) {
        persist((prev) => ({
          ...prev,
          debts: prev.debts.map((d) => (d.id === id ? { ...d, isArchived: true } : d)),
        }));
        cloudWrite(() =>
          createClient()!.from("debts").update({ is_archived: true }).eq("id", id),
        );
        return null;
      }
      persist((prev) => ({
        ...prev,
        debts: prev.debts.filter((d) => d.id !== id),
      }));
      cloudWrite(() => createClient()!.from("debts").delete().eq("id", id));
      return null;
    },
    [data.transactions, persist],
  );

  const addSavingsGoal = useCallback(
    (input: {
      name: string;
      targetAmount: number;
      targetDate?: string;
      preferredAccountId?: string;
    }) => {
      if (!workspace) return "Selecciona un espacio.";
      if (!input.name.trim() || input.targetAmount <= 0) return "Datos de meta inválidos.";
      const id = makeId("goal");
      const createdAt = new Date().toISOString();
      const targetAmount = Math.round(input.targetAmount);
      persist((prev) => ({
        ...prev,
        savingsGoals: [
          ...prev.savingsGoals,
          {
            id,
            workspaceId: workspace.id,
            name: input.name.trim(),
            targetAmount,
            targetDate: input.targetDate || undefined,
            preferredAccountId: input.preferredAccountId,
            isArchived: false,
            createdAt,
          },
        ],
      }));
      cloudWrite(() =>
        createClient()!.from("savings_goals").insert({
          id,
          workspace_id: workspace.id,
          name: input.name.trim(),
          target_amount: targetAmount,
          target_date: input.targetDate || null,
          preferred_account_id: input.preferredAccountId ?? null,
          is_archived: false,
          created_at: createdAt,
        }),
      );
      return null;
    },
    [persist, workspace],
  );

  const updateSavingsGoal = useCallback(
    (
      id: string,
      patch: Partial<Pick<SavingsGoal, "name" | "targetAmount" | "targetDate" | "preferredAccountId">>,
    ) => {
      if (!data.savingsGoals.some((g) => g.id === id)) return "Meta no encontrada.";
      if (patch.name !== undefined && !patch.name.trim()) return "Nombre inválido.";
      if (patch.targetAmount !== undefined && patch.targetAmount <= 0) return "Monto inválido.";
      persist((prev) => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map((g) =>
          g.id === id
            ? {
                ...g,
                ...patch,
                name: patch.name?.trim() ?? g.name,
                targetAmount:
                  patch.targetAmount !== undefined
                    ? Math.round(patch.targetAmount)
                    : g.targetAmount,
              }
            : g,
        ),
      }));
      return null;
    },
    [data.savingsGoals, persist],
  );

  const deleteSavingsGoal = useCallback(
    (id: string) => {
      const linked = data.transactions.some((t) => t.savingsGoalId === id);
      if (linked) {
        persist((prev) => ({
          ...prev,
          savingsGoals: prev.savingsGoals.map((g) =>
            g.id === id ? { ...g, isArchived: true } : g,
          ),
        }));
        return null;
      }
      persist((prev) => ({
        ...prev,
        savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
      }));
      return null;
    },
    [data.transactions, persist],
  );

  const updateWorkspace = useCallback(
    (id: string, patch: Partial<Pick<Workspace, "name" | "avatarData" | "accentColor">>) => {
      const ws = data.workspaces.find((w) => w.id === id);
      if (!ws) return "Espacio no encontrado.";
      const nextName = patch.name !== undefined ? patch.name.trim() : undefined;
      if (patch.name !== undefined && !nextName) return "Nombre inválido.";

      persist((prev) => ({
        ...prev,
        workspaces: prev.workspaces.map((w) => {
          if (w.id !== id) return w;
          const merged = { ...w };
          if (nextName !== undefined) merged.name = nextName;
          if (patch.avatarData !== undefined) {
            if (patch.avatarData) merged.avatarData = patch.avatarData;
            else delete merged.avatarData;
          }
          if (patch.accentColor !== undefined) {
            if (patch.accentColor) merged.accentColor = patch.accentColor;
            else delete merged.accentColor;
          }
          return merged;
        }),
      }));
      if (cloudEnabled()) {
        void cloudUpdateWorkspace(id, {
          ...(nextName !== undefined ? { name: nextName } : {}),
          ...(patch.avatarData !== undefined ? { avatarData: patch.avatarData } : {}),
          ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor } : {}),
        });
      }
      return null;
    },
    [data.workspaces, persist],
  );

  const renameWorkspace = useCallback(
    (id: string, name: string) => updateWorkspace(id, { name }),
    [updateWorkspace],
  );

  const deleteWorkspace = useCallback(
    (id: string) => {
      if (!user) return "Sesión inválida.";
      const ws = data.workspaces.find((w) => w.id === id);
      if (!ws) return "Espacio no encontrado.";
      if (ws.type === "personal") return "No puedes eliminar tu espacio personal.";
      const membership = data.members.find((m) => m.workspaceId === id && m.userId === user.id);
      if (!membership || membership.role !== "owner") {
        return "Solo el dueño puede eliminar el espacio.";
      }
      const personal = data.workspaces.find(
        (w) =>
          w.type === "personal" &&
          data.members.some((m) => m.workspaceId === w.id && m.userId === user.id),
      );
      persist((prev) => ({
        ...prev,
        workspaces: prev.workspaces.filter((w) => w.id !== id),
        members: prev.members.filter((m) => m.workspaceId !== id),
        invites: prev.invites.filter((i) => i.workspaceId !== id),
        institutions: prev.institutions.filter((i) => i.workspaceId !== id),
        accounts: prev.accounts.filter((a) => a.workspaceId !== id),
        categories: prev.categories.filter((c) => c.workspaceId !== id),
        budgets: prev.budgets.filter((b) => b.workspaceId !== id),
        workspaceBudgets: (prev.workspaceBudgets ?? []).filter((b) => b.workspaceId !== id),
        debts: prev.debts.filter((d) => d.workspaceId !== id),
        savingsGoals: prev.savingsGoals.filter((g) => g.workspaceId !== id),
        transactions: prev.transactions.filter((t) => t.workspaceId !== id),
        activeWorkspaceId:
          prev.activeWorkspaceId === id ? personal?.id ?? null : prev.activeWorkspaceId,
      }));
      cloudWrite(() => createClient()!.from("workspaces").delete().eq("id", id));
      return null;
    },
    [data.members, data.workspaces, persist, user],
  );

  const accountBalance = useCallback(
    (accountId: string) => {
      const account = data.accounts.find((a) => a.id === accountId);
      if (!account) return 0;
      let balance = account.initialBalance;
      for (const tx of data.transactions) {
        if (tx.type === "income" && tx.accountId === accountId) balance += tx.amount;
        if (tx.type === "expense" && tx.accountId === accountId) balance -= tx.amount;
        if (tx.type === "debt_payment" && tx.accountId === accountId) balance -= tx.amount;
        if (tx.type === "savings_contribution" && tx.accountId === accountId) {
          // money stays in account but earmarked; balance of account unchanged conceptually
          // treat as still in account
        }
        if (tx.type === "savings_withdrawal" && tx.accountId === accountId) {
          // withdrawal from goal back to free use - still in same account
        }
        if (tx.type === "transfer") {
          if (tx.accountId === accountId) balance -= tx.amount;
          if (tx.toAccountId === accountId) balance += tx.amount;
        }
        if (tx.type === "space_contribution" && tx.accountId === accountId) {
          balance -= tx.amount;
        }
      }
      return balance;
    },
    [data.accounts, data.transactions],
  );

  const goalProgress = useCallback(
    (goalId: string) => {
      return data.transactions.reduce((sum, tx) => {
        if (tx.savingsGoalId !== goalId) return sum;
        if (tx.type === "savings_contribution") return sum + tx.amount;
        if (tx.type === "savings_withdrawal") return sum - tx.amount;
        return sum;
      }, 0);
    },
    [data.transactions],
  );

  const spentInCategory = useCallback(
    (categoryId: string, year?: number, month?: number) => {
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      return data.transactions
        .filter(
          (tx) =>
            tx.type === "expense" &&
            tx.categoryId === categoryId &&
            inPeriod(tx.date, y, m),
        )
        .reduce((s, tx) => s + tx.amount, 0);
    },
    [data.transactions],
  );

  const workspaceCategories = useCallback(
    (kind?: CategoryKind) =>
      data.categories.filter(
        (c) =>
          c.workspaceId === workspace?.id &&
          !c.isArchived &&
          (kind ? c.kind === kind : true),
      ),
    [data.categories, workspace?.id],
  );

  const workspaceAccounts = useCallback(
    () =>
      data.accounts.filter((a) => a.workspaceId === workspace?.id && !a.isArchived),
    [data.accounts, workspace?.id],
  );

  const workspaceTransactions = useCallback(() => {
    if (!workspace) return [];
    const wsId = workspace.id;
    const categoryIds = new Set(
      data.categories.filter((c) => c.workspaceId === wsId).map((c) => c.id),
    );
    const debtIds = new Set(
      data.debts.filter((d) => d.workspaceId === wsId).map((d) => d.id),
    );
    const goalIds = new Set(
      data.savingsGoals.filter((g) => g.workspaceId === wsId).map((g) => g.id),
    );

    return data.transactions
      .filter((t) => {
        if (t.workspaceId !== wsId) return false;
        // Ingresos/gastos: solo si la categoría es de este espacio
        if (t.type === "income" || t.type === "expense") {
          return Boolean(t.categoryId && categoryIds.has(t.categoryId));
        }
        if (t.type === "debt_payment") {
          return Boolean(t.debtId && debtIds.has(t.debtId));
        }
        if (t.type === "savings_contribution" || t.type === "savings_withdrawal") {
          return Boolean(t.savingsGoalId && goalIds.has(t.savingsGoalId));
        }
        if (t.type === "space_contribution") return true;
        // Transferencias del espacio activo
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data.categories, data.debts, data.savingsGoals, data.transactions, workspace]);

  const workspaceBudgets = useCallback(
    (year?: number, month?: number) => {
      const period = currentPeriod();
      const y = year ?? period.year;
      const m = month ?? period.month;
      return data.budgets.filter(
        (b) =>
          b.workspaceId === workspace?.id &&
          b.periodYear === y &&
          b.periodMonth === m,
      );
    },
    [data.budgets, workspace?.id],
  );

  const workspaceDebts = useCallback(
    () => data.debts.filter((d) => d.workspaceId === workspace?.id && !d.isArchived),
    [data.debts, workspace?.id],
  );

  const workspaceGoals = useCallback(
    () =>
      data.savingsGoals.filter((g) => g.workspaceId === workspace?.id && !g.isArchived),
    [data.savingsGoals, workspace?.id],
  );

  const memberName = useCallback(
    (userId: string) =>
      data.profiles.find((p) => p.id === userId)?.displayName ?? "Usuario",
    [data.profiles],
  );

  const value: AppContextValue = {
    ready,
    data,
    user,
    workspace,
    myWorkspaces,
    register,
    login,
    logout,
    setActiveWorkspace,
    updateProfile,
    createSharedWorkspace,
    createInvite,
    acceptInvite,
    addCategory,
    updateCategory,
    archiveCategory,
    deleteCategory,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    addAccount,
    updateAccount,
    archiveAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    repeatTransaction,
    setTransactionRecurring,
    upsertBudget,
    deleteBudget,
    upsertWorkspaceBudget,
    deleteWorkspaceBudget,
    workspaceBudgetFunded,
    workspaceBudgetSpent,
    addDebt,
    updateDebt,
    deleteDebt,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    renameWorkspace,
    updateWorkspace,
    deleteWorkspace,
    accountBalance,
    goalProgress,
    spentInCategory,
    personalWorkspace,
    sharedWorkspaces,
    categoriesFor,
    debtsFor,
    goalsFor,
    fundingAccounts,
    itemLabel,
    allCategories,
    allDebts,
    allGoals,
    allAccounts,
    allTransactions,
    workspaceCategories,
    workspaceAccounts,
    workspaceTransactions,
    workspaceBudgets,
    workspaceDebts,
    workspaceGoals,
    memberName,
    workspaceLabel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
