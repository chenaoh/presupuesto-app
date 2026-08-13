import { BASE_CATEGORIES, BASE_INSTITUTIONS } from "../constants";
import type {
  Account,
  AppData,
  Budget,
  Category,
  Debt,
  Institution,
  Profile,
  SavingsGoal,
  ThemeMode,
  Transaction,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
} from "../types";
import { EMPTY_DATA } from "../types";
import { createClient, isSupabaseConfigured } from "./client";

const ACTIVE_WS_KEY = "presupuesto-app:active-ws";

export function cloudEnabled() {
  return isSupabaseConfigured();
}

export function newEntityId() {
  return crypto.randomUUID();
}

function mapProfile(
  row: {
    id: string;
    display_name: string;
    theme: string;
    accent_color: string;
    locale: string;
    currency: string;
    created_at: string;
    avatar_url?: string | null;
  },
  email: string,
): Profile {
  return {
    id: row.id,
    email,
    passwordHash: "",
    displayName: row.display_name,
    theme: row.theme as ThemeMode,
    accentColor: row.accent_color,
    locale: row.locale,
    currency: row.currency,
    createdAt: row.created_at,
    avatarData: row.avatar_url ?? undefined,
  };
}

function mapWorkspace(row: {
  id: string;
  name: string;
  type: string;
  created_by: string;
  created_at: string;
  avatar_url?: string | null;
  accent_color?: string | null;
}): Workspace {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Workspace["type"],
    createdBy: row.created_by,
    createdAt: row.created_at,
    avatarData: row.avatar_url ?? undefined,
    accentColor: row.accent_color ?? undefined,
  };
}

function mapMember(row: {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role as WorkspaceMember["role"],
    joinedAt: row.joined_at,
  };
}

function mapInvite(row: {
  id: string;
  workspace_id: string;
  code: string;
  created_by: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
}): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    code: row.code,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    usedBy: row.used_by ?? undefined,
    usedAt: row.used_at ?? undefined,
  };
}

function mapInstitution(row: {
  id: string;
  workspace_id: string;
  name: string;
  is_system: boolean;
}): Institution {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    isSystem: row.is_system,
  };
}

function mapAccount(row: {
  id: string;
  workspace_id: string;
  name: string;
  institution_id: string;
  account_type: string;
  initial_balance: number | string;
  is_archived: boolean;
  created_at: string;
}): Account {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    institutionId: row.institution_id,
    accountType: row.account_type as Account["accountType"],
    initialBalance: Number(row.initial_balance),
    isArchived: row.is_archived,
    createdAt: row.created_at,
  };
}

function mapCategory(row: {
  id: string;
  workspace_id: string;
  name: string;
  kind: string;
  is_system: boolean;
  icon: string;
  color: string;
  is_archived: boolean;
}): Category {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    kind: row.kind as Category["kind"],
    isSystem: row.is_system,
    icon: row.icon,
    color: row.color,
    isArchived: row.is_archived,
  };
}

function mapBudget(row: {
  id: string;
  workspace_id: string;
  category_id: string;
  period_year: number;
  period_month: number;
  limit_amount: number | string;
}): Budget {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    categoryId: row.category_id,
    periodYear: row.period_year,
    periodMonth: row.period_month,
    limitAmount: Number(row.limit_amount),
  };
}

function mapDebt(row: {
  id: string;
  workspace_id: string;
  name: string;
  principal: number | string;
  remaining: number | string;
  due_date: string | null;
  account_id: string | null;
  is_archived: boolean;
  created_at: string;
}): Debt {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    principal: Number(row.principal),
    remaining: Number(row.remaining),
    dueDate: row.due_date ?? undefined,
    accountId: row.account_id ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  };
}

function mapGoal(row: {
  id: string;
  workspace_id: string;
  name: string;
  target_amount: number | string;
  target_date: string | null;
  preferred_account_id: string | null;
  is_archived: boolean;
  created_at: string;
}): SavingsGoal {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    targetDate: row.target_date ?? undefined,
    preferredAccountId: row.preferred_account_id ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  };
}

function mapTx(row: {
  id: string;
  workspace_id: string;
  type: string;
  amount: number | string;
  date: string;
  note: string;
  category_id: string | null;
  account_id: string | null;
  to_account_id: string | null;
  debt_id: string | null;
  savings_goal_id: string | null;
  recurring?: boolean | null;
  payment_method?: string | null;
  created_by: string;
  created_at: string;
}): Transaction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type as Transaction["type"],
    amount: Number(row.amount),
    date: row.date,
    note: row.note ?? "",
    categoryId: row.category_id ?? undefined,
    accountId: row.account_id ?? undefined,
    toAccountId: row.to_account_id ?? undefined,
    debtId: row.debt_id ?? undefined,
    savingsGoalId: row.savings_goal_id ?? undefined,
    recurring: Boolean(row.recurring),
    paymentMethod: (row.payment_method as Transaction["paymentMethod"]) || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function readActiveWorkspaceId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_WS_KEY);
}

export function writeActiveWorkspaceId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_WS_KEY, id);
  else localStorage.removeItem(ACTIVE_WS_KEY);
}

async function seedWorkspace(workspaceId: string) {
  const sb = createClient();
  if (!sb) throw new Error("Supabase no configurado");

  const institutions = BASE_INSTITUTIONS.map((name) => ({
    id: newEntityId(),
    workspace_id: workspaceId,
    name,
    is_system: true,
  }));
  const { error: instErr } = await sb.from("institutions").insert(institutions);
  if (instErr) throw instErr;

  const categories = BASE_CATEGORIES.map((c) => ({
    id: newEntityId(),
    workspace_id: workspaceId,
    name: c.name,
    kind: c.kind,
    is_system: true,
    icon: c.icon,
    color: c.color,
    is_archived: false,
  }));
  const { error: catErr } = await sb.from("categories").insert(categories);
  if (catErr) throw catErr;
}

export async function ensurePersonalWorkspace(userId: string) {
  const sb = createClient();
  if (!sb) throw new Error("Supabase no configurado");

  const { data: memberships, error: memErr } = await sb
    .from("workspace_members")
    .select("workspace_id, workspaces(id, type)")
    .eq("user_id", userId);
  if (memErr) throw memErr;

  const hasPersonal = (memberships ?? []).some((m) => {
    const ws = m.workspaces as unknown as { id: string; type: string } | null;
    return ws?.type === "personal";
  });
  if (hasPersonal) return;

  const workspaceId = newEntityId();
  const { error: wsErr } = await sb.from("workspaces").insert({
    id: workspaceId,
    name: "Personal",
    type: "personal",
    created_by: userId,
  });
  if (wsErr) throw wsErr;

  const { error: memberErr } = await sb.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: userId,
    role: "owner",
  });
  if (memberErr) throw memberErr;

  await seedWorkspace(workspaceId);
}

export async function loadCloudData(userId: string, email: string): Promise<AppData> {
  const sb = createClient();
  if (!sb) return EMPTY_DATA;

  await ensurePersonalWorkspace(userId);

  const { data: myMemberships, error: memErr } = await sb
    .from("workspace_members")
    .select("*")
    .eq("user_id", userId);
  if (memErr) throw memErr;

  const workspaceIds = (myMemberships ?? []).map((m) => m.workspace_id as string);
  if (workspaceIds.length === 0) {
    return {
      ...EMPTY_DATA,
      sessionUserId: userId,
      activeWorkspaceId: null,
    };
  }

  const [
    profilesRes,
    workspacesRes,
    membersRes,
    invitesRes,
    institutionsRes,
    accountsRes,
    categoriesRes,
    budgetsRes,
    debtsRes,
    goalsRes,
    txRes,
  ] = await Promise.all([
    sb.from("profiles").select("*"),
    sb.from("workspaces").select("*").in("id", workspaceIds),
    sb.from("workspace_members").select("*").in("workspace_id", workspaceIds),
    sb.from("workspace_invites").select("*").in("workspace_id", workspaceIds),
    sb.from("institutions").select("*").in("workspace_id", workspaceIds),
    sb.from("accounts").select("*").in("workspace_id", workspaceIds),
    sb.from("categories").select("*").in("workspace_id", workspaceIds),
    sb.from("budgets").select("*").in("workspace_id", workspaceIds),
    sb.from("debts").select("*").in("workspace_id", workspaceIds),
    sb.from("savings_goals").select("*").in("workspace_id", workspaceIds),
    sb.from("transactions").select("*").in("workspace_id", workspaceIds),
  ]);

  const firstError = [
    profilesRes,
    workspacesRes,
    membersRes,
    invitesRes,
    institutionsRes,
    accountsRes,
    categoriesRes,
    budgetsRes,
    debtsRes,
    goalsRes,
    txRes,
  ].find((r) => r.error)?.error;
  if (firstError) throw firstError;

  const profiles = (profilesRes.data ?? []).map((p) =>
    mapProfile(p, p.id === userId ? email : ""),
  );
  if (!profiles.some((p) => p.id === userId)) {
    profiles.push({
      id: userId,
      email,
      passwordHash: "",
      displayName: email.split("@")[0] || "Usuario",
      theme: "system",
      accentColor: "#1F6B4F",
      locale: "es-CO",
      currency: "COP",
      createdAt: new Date().toISOString(),
    });
  } else {
    const mine = profiles.find((p) => p.id === userId);
    if (mine) mine.email = email;
  }

  const workspaces = (workspacesRes.data ?? []).map(mapWorkspace);
  const personal = workspaces.find((w) => w.type === "personal");
  const savedActive = readActiveWorkspaceId();
  const activeWorkspaceId =
    (savedActive && workspaces.some((w) => w.id === savedActive) && savedActive) ||
    personal?.id ||
    workspaces[0]?.id ||
    null;

  return {
    profiles,
    workspaces,
    members: (membersRes.data ?? []).map(mapMember),
    invites: (invitesRes.data ?? []).map(mapInvite),
    institutions: (institutionsRes.data ?? []).map(mapInstitution),
    accounts: (accountsRes.data ?? []).map(mapAccount),
    categories: (categoriesRes.data ?? []).map(mapCategory),
    budgets: (budgetsRes.data ?? []).map(mapBudget),
    debts: (debtsRes.data ?? []).map(mapDebt),
    savingsGoals: (goalsRes.data ?? []).map(mapGoal),
    transactions: (txRes.data ?? []).map(mapTx),
    sessionUserId: userId,
    activeWorkspaceId,
  };
}

export async function cloudRegister(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ error: string | null; data?: AppData }> {
  const sb = createClient();
  if (!sb) return { error: "Supabase no está configurado en este entorno." };

  const email = input.email.trim().toLowerCase();
  const { data, error } = await sb.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { display_name: input.displayName.trim() },
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear la cuenta." };

  if (!data.session) {
    return {
      error:
        "Cuenta creada. Revisa tu correo para confirmarla (o desactiva 'Confirm email' en Supabase Auth) y luego inicia sesión.",
    };
  }

  // Esperar a que el trigger cree el perfil
  await new Promise((r) => setTimeout(r, 400));
  const { error: profileErr } = await sb.from("profiles").upsert({
    id: data.user.id,
    display_name: input.displayName.trim(),
  });
  if (profileErr) return { error: profileErr.message };

  try {
    await ensurePersonalWorkspace(data.user.id);
    const appData = await loadCloudData(data.user.id, email);
    return { error: null, data: appData };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear tu espacio personal." };
  }
}

export async function cloudLogin(
  email: string,
  password: string,
): Promise<{ error: string | null; data?: AppData }> {
  const sb = createClient();
  if (!sb) return { error: "Supabase no está configurado en este entorno." };

  const normalized = email.trim().toLowerCase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error) return { error: "Correo o contraseña incorrectos." };
  if (!data.user) return { error: "No se pudo iniciar sesión." };

  try {
    const appData = await loadCloudData(data.user.id, data.user.email ?? normalized);
    return { error: null, data: appData };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al cargar tus datos." };
  }
}

export async function cloudLogout() {
  const sb = createClient();
  if (!sb) return;
  writeActiveWorkspaceId(null);
  await sb.auth.signOut();
}

export async function cloudCreateSharedWorkspace(
  userId: string,
  name: string,
): Promise<{ error: string | null; workspaceId?: string }> {
  const sb = createClient();
  if (!sb) return { error: "Supabase no configurado." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Escribe un nombre para el espacio familiar." };

  const workspaceId = newEntityId();
  const { error: wsErr } = await sb.from("workspaces").insert({
    id: workspaceId,
    name: trimmed,
    type: "shared",
    created_by: userId,
  });
  if (wsErr) return { error: wsErr.message };

  const { error: memErr } = await sb.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: userId,
    role: "owner",
  });
  if (memErr) return { error: memErr.message };

  try {
    await seedWorkspace(workspaceId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al sembrar el espacio." };
  }

  writeActiveWorkspaceId(workspaceId);
  return { error: null, workspaceId };
}

export async function cloudCreateInvite(
  userId: string,
  workspaceId: string,
): Promise<{ error: string | null; code?: string }> {
  const sb = createClient();
  if (!sb) return { error: "Supabase no configurado." };

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await sb.from("workspace_invites").insert({
    workspace_id: workspaceId,
    code,
    created_by: userId,
    expires_at: expiresAt,
  });
  if (error) return { error: error.message };
  return { error: null, code };
}

export async function cloudAcceptInvite(
  code: string,
): Promise<{ error: string | null; workspaceId?: string }> {
  const sb = createClient();
  if (!sb) return { error: "Supabase no configurado." };

  const { data, error } = await sb.rpc("accept_workspace_invite", {
    p_code: code.trim(),
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("invalid_code")) return { error: "Código inválido." };
    if (msg.includes("expired_code")) return { error: "El código expiró." };
    if (msg.includes("already_member")) return { error: "Ya perteneces a este espacio." };
    if (msg.includes("not_authenticated")) return { error: "Debes iniciar sesión." };
    return { error: "No se pudo unir al espacio. ¿Ejecutaste la migración 002 en Supabase?" };
  }

  const workspaceId = data as string;
  writeActiveWorkspaceId(workspaceId);
  return { error: null, workspaceId };
}

export async function cloudUpdateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "displayName" | "theme" | "accentColor" | "avatarData">>,
) {
  const sb = createClient();
  if (!sb) return;
  const row: Record<string, string | null> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.theme !== undefined) row.theme = patch.theme;
  if (patch.accentColor !== undefined) row.accent_color = patch.accentColor;
  if (patch.avatarData !== undefined) row.avatar_url = patch.avatarData || null;
  if (Object.keys(row).length === 0) return;
  await sb.from("profiles").update(row).eq("id", userId);
}

export async function cloudUpdateWorkspace(
  workspaceId: string,
  patch: Partial<Pick<Workspace, "name" | "avatarData" | "accentColor">>,
) {
  const sb = createClient();
  if (!sb) return;
  const row: Record<string, string | null> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.avatarData !== undefined) row.avatar_url = patch.avatarData || null;
  if (patch.accentColor !== undefined) row.accent_color = patch.accentColor || null;
  if (Object.keys(row).length === 0) return;
  await sb.from("workspaces").update(row).eq("id", workspaceId);
}

/** Inserta/actualiza/borra en Supabase sin bloquear la UI si falla (se loguea). */
export function cloudWrite(
  op: () => PromiseLike<{ error: { message: string } | null }>,
) {
  if (!cloudEnabled()) return;
  void Promise.resolve(op()).then(({ error }) => {
    if (error) console.error("[supabase]", error.message);
  });
}
