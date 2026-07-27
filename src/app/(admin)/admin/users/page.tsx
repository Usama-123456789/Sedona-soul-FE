"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MailPlus,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "user";
type UserStatus = "active" | "disabled" | "deleted";
type InvitationStatus = "accepted" | "expired" | "pending" | "revoked";
type BooleanFilter = "all" | "false" | "true";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type AdminUser = {
  id: string;
  pseudonymousUserId: string;
  role: UserRole;
  status: UserStatus;
  currentPhase: string | null;
  currentModule: string | null;
  onboardingComplete: boolean;
  baselineCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type UserInvitation = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedByAdminId: string | null;
  acceptedUserId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserFilters = {
  baselineCompleted: BooleanFilter;
  currentPhase: string;
  onboardingComplete: BooleanFilter;
  role: "all" | UserRole;
  status: "all" | UserStatus;
};

type InvitationFilters = {
  email: string;
  status: "all" | InvitationStatus;
};

type EditableUserState = {
  baselineCompleted: boolean;
  preferredName: string;
  currentModule: string;
  currentPhase: string;
  onboardingComplete: boolean;
  role: UserRole;
  status: UserStatus;
};

type QueryValue = boolean | number | string | null | undefined;

type MetricTile = {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: "blue" | "clay" | "pine" | "sage";
  value: number | string;
};

const userPageSize = 12;
const invitationPageSize = 8;

const initialUserFilters: UserFilters = {
  baselineCompleted: "all",
  currentPhase: "",
  onboardingComplete: "all",
  role: "all",
  status: "all",
};

const initialInvitationFilters: InvitationFilters = {
  email: "",
  status: "all",
};

const statusClasses: Record<UserStatus | InvitationStatus, string> = {
  accepted: "bg-[#E4EFE8] text-[#3E7A5E]",
  active: "bg-[#E4EFE8] text-[#3E7A5E]",
  deleted: "bg-[#F4EFE6] text-[#7C7363]",
  disabled: "bg-[#F7E5DA] text-[#B85028]",
  expired: "bg-[#F4EFE6] text-[#7C7363]",
  pending: "bg-[#E8ECF5] text-[#465980]",
  revoked: "bg-[#F7E5DA] text-[#B85028]",
};

const toneClasses: Record<MetricTile["tone"], string> = {
  blue: "bg-[#E8ECF5] text-[#465980]",
  clay: "bg-[#F7E5DA] text-[#B85028]",
  pine: "bg-[#E4ECE6] text-[#12362C]",
  sage: "bg-[#E4EFE8] text-[#3E7A5E]",
};

const selectClass = "h-10 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-3 text-sm font-semibold text-[#16352B] outline-none transition focus:border-[#B85028] focus:bg-white";
const inputClass = "h-10 rounded-full border border-[#E4DBCE] bg-[#FBF7EF] px-3 text-sm font-semibold text-[#16352B] outline-none placeholder:text-[#A89A82] transition focus:border-[#B85028] focus:bg-white";
const iconButtonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const readApiResponse = async <T,>(response: Response) => {
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && "error" in payload ? payload.error : null;
    throw new Error(error?.message ?? "Request failed.");
  }

  return payload.data;
};

const buildUrl = (path: string, params: Record<string, QueryValue> = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const search = query.toString();
  return search ? path + "?" + search : path;
};

const requestJson = async <T,>(path: string, init: RequestInit = {}) => {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  return readApiResponse<T>(response);
};

const formatLabel = (value: string) =>
  value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
};

const toEditableUserState = (user: AdminUser): EditableUserState => ({
  baselineCompleted: user.baselineCompleted,
  preferredName: "",
  currentModule: user.currentModule ?? "",
  currentPhase: user.currentPhase ?? "stabilize",
  onboardingComplete: user.onboardingComplete,
  role: user.role,
  status: user.status,
});

const buildUserPatch = (user: AdminUser, form: EditableUserState) => {
  const patch: Partial<{
    baselineCompleted: boolean;
    currentModule: string | null;
    currentPhase: string;
    preferredName: string | null;
    onboardingComplete: boolean;
    role: UserRole;
    status: UserStatus;
  }> = {};

  const nextPreferredName = form.preferredName.trim();
  if (nextPreferredName) {
    patch.preferredName = nextPreferredName;
  }

  if (form.role !== user.role) {
    patch.role = form.role;
  }

  if (form.status !== user.status) {
    patch.status = form.status;
  }

  if (form.onboardingComplete !== user.onboardingComplete) {
    patch.onboardingComplete = form.onboardingComplete;
  }

  if (form.baselineCompleted !== user.baselineCompleted) {
    patch.baselineCompleted = form.baselineCompleted;
  }

  if (form.currentPhase.trim() && form.currentPhase.trim() !== (user.currentPhase ?? "")) {
    patch.currentPhase = form.currentPhase.trim();
  }

  const nextModule = form.currentModule.trim() || null;
  if (nextModule !== user.currentModule) {
    patch.currentModule = nextModule;
  }

  return patch;
};

const hasChanges = (patch: object) => Object.keys(patch).length > 0;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [userFilters, setUserFilters] = useState<UserFilters>(initialUserFilters);
  const [userPage, setUserPage] = useState(1);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditableUserState | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [invitationPagination, setInvitationPagination] = useState<Pagination | null>(null);
  const [invitationFilters, setInvitationFilters] = useState<InvitationFilters>(initialInvitationFilters);
  const [invitationPage, setInvitationPage] = useState(1);
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(true);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("user");
  const [isInviting, setIsInviting] = useState(false);
  const [actingInvitationId, setActingInvitationId] = useState<string | null>(null);

  const userQueryParams = useMemo(
    () => ({
      baselineCompleted: userFilters.baselineCompleted === "all" ? undefined : userFilters.baselineCompleted,
      currentPhase: userFilters.currentPhase.trim() || undefined,
      onboardingComplete: userFilters.onboardingComplete === "all" ? undefined : userFilters.onboardingComplete,
      page: userPage,
      pageSize: userPageSize,
      role: userFilters.role === "all" ? undefined : userFilters.role,
      status: userFilters.status === "all" ? undefined : userFilters.status,
    }),
    [userFilters, userPage],
  );

  const invitationQueryParams = useMemo(
    () => ({
      email: invitationFilters.email.trim() || undefined,
      page: invitationPage,
      pageSize: invitationPageSize,
      status: invitationFilters.status === "all" ? undefined : invitationFilters.status,
    }),
    [invitationFilters, invitationPage],
  );

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setUsersError(null);

    try {
      const data = await requestJson<{ users: AdminUser[]; pagination: Pagination }>(buildUrl("/api/admin/users", userQueryParams));
      setUsers(data.users);
      setUserPagination(data.pagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load users.";
      setUsers([]);
      setUserPagination(null);
      setUsersError(message);
      toast({
        description: message,
        title: "Users could not load",
        variant: "destructive",
      });
    } finally {
      setIsUsersLoading(false);
    }
  }, [toast, userQueryParams]);

  const loadInvitations = useCallback(async () => {
    setIsInvitationsLoading(true);
    setInvitationsError(null);

    try {
      const data = await requestJson<{ invitations: UserInvitation[]; pagination: Pagination }>(buildUrl("/api/admin/users/invitations", invitationQueryParams));
      setInvitations(data.invitations);
      setInvitationPagination(data.pagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load invitations.";
      setInvitations([]);
      setInvitationPagination(null);
      setInvitationsError(message);
      toast({
        description: message,
        title: "Invitations could not load",
        variant: "destructive",
      });
    } finally {
      setIsInvitationsLoading(false);
    }
  }, [invitationQueryParams, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const totalUsers = userPagination?.total ?? users.length;
  const totalInvitations = invitationPagination?.total ?? invitations.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending").length;
  const visibleCompletedBaseline = users.filter((user) => user.baselineCompleted).length;

  const metricTiles: MetricTile[] = [
    { helper: "All matching filters", icon: Users, label: "Total users", tone: "pine", value: totalUsers },
    { helper: "Visible on this page", icon: UserRound, label: "Active shown", tone: "sage", value: activeUsers },
    { helper: "Admin role shown", icon: ShieldCheck, label: "Admins shown", tone: "blue", value: adminUsers },
    { helper: "Pending on this page", icon: MailPlus, label: "Pending invites", tone: "clay", value: pendingInvitations },
  ];

  const startEditing = (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditingUser(toEditableUserState(user));
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditingUser(null);
  };

  const updateEditingUser = <TKey extends keyof EditableUserState>(key: TKey, value: EditableUserState[TKey]) => {
    setEditingUser((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveUser = async (user: AdminUser) => {
    if (!editingUser) {
      return;
    }

    const patch = buildUserPatch(user, editingUser);

    if (!hasChanges(patch)) {
      toast({
        description: "The selected user fields already match the saved account.",
        title: "No changes to save",
      });
      cancelEditing();
      return;
    }

    setSavingUserId(user.id);
    setUsersError(null);

    try {
      await requestJson<{ user: AdminUser }>("/api/admin/users/" + encodeURIComponent(user.id), {
        body: JSON.stringify(patch),
        method: "PATCH",
      });
      cancelEditing();
      toast({
        description: `${user.pseudonymousUserId} was updated successfully.`,
        title: "User updated",
        variant: "success",
      });
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user.";
      setUsersError(message);
      toast({
        description: message,
        title: "User update failed",
        variant: "destructive",
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    setDeletingUserId(user.id);
    setUsersError(null);

    try {
      await requestJson<{ deleted: boolean; user: AdminUser }>("/api/admin/users/" + encodeURIComponent(user.id), {
        method: "DELETE",
      });
      if (editingUserId === user.id) {
        cancelEditing();
      }
      setPendingDeleteUser(null);
      toast({
        description: `${user.pseudonymousUserId} was marked as deleted and active sessions were revoked.`,
        title: "User deleted",
        variant: "success",
      });
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete user.";
      setUsersError(message);
      toast({
        description: message,
        title: "Delete failed",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = inviteEmail.trim().toLowerCase();

    setIsInviting(true);
    setInvitationsError(null);

    try {
      await requestJson<{ invitation: UserInvitation }>("/api/admin/users/invitations", {
        body: JSON.stringify({
          email: normalizedEmail,
          role: inviteRole,
        }),
        method: "POST",
      });
      setInviteEmail("");
      setInviteRole("user");
      setInvitationFilters(initialInvitationFilters);
      setInvitationPage(1);
      toast({
        description: `Invite email sent to ${normalizedEmail}.`,
        title: "Invitation sent",
        variant: "success",
      });
      await loadInvitations();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send invitation.";
      setInvitationsError(message);
      toast({
        description: message,
        title: "Invitation failed",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const actOnInvitation = async (invitation: UserInvitation, action: "resend" | "revoke") => {
    setActingInvitationId(invitation.id);
    setInvitationsError(null);

    try {
      await requestJson<{ invitation: UserInvitation; resent?: boolean; revoked?: boolean }>(
        "/api/admin/users/invitations/" + encodeURIComponent(invitation.id) + "/" + action,
        { method: "POST" },
      );
      toast({
        description:
          action === "resend"
            ? `A fresh invite email was sent to ${invitation.email}.`
            : `${invitation.email} can no longer use that invite link.`,
        title: action === "resend" ? "Invitation resent" : "Invitation revoked",
        variant: "success",
      });
      await loadInvitations();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to " + action + " invitation.";
      setInvitationsError(message);
      toast({
        description: message,
        title: action === "resend" ? "Resend failed" : "Revoke failed",
        variant: "destructive",
      });
    } finally {
      setActingInvitationId(null);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.42)] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <p className="sedona-eyebrow">Admin users</p>
          <h1 className="mt-1 font-serif text-4xl font-normal leading-tight text-[#16352B]">Users and invitations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7C7363]">
            Review pseudonymized users, update safe account fields, and manage admin-sent invitations without exposing journals, reflections, or chat content.
          </p>
        </div>
        <button
          className={cn(iconButtonClass, "bg-[#12362C] text-[#F4EFE6] shadow-[0_14px_30px_-22px_rgba(18,54,44,0.8)] hover:bg-[#1B493B]")}
          onClick={() => {
            void loadUsers();
            void loadInvitations();
          }}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricTiles.map((tile) => (
          <MetricCard key={tile.label} tile={tile} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="min-w-0 rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="sedona-eyebrow">Users</p>
              <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Safe account list</h2>
              <p className="mt-1 text-sm leading-6 text-[#7C7363]">Edit only role, status, journey location, onboarding, and baseline flags.</p>
            </div>
            <div className="rounded-2xl bg-[#F4EFE6] px-4 py-3 text-sm font-semibold text-[#7C7363]">
              <span className="text-[#16352B]">{visibleCompletedBaseline}</span> baseline complete on this page
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-[#E8DFD1] bg-[#FBF7EF] p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#A89A82]">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <FilterSelect
                label="Status"
                onChange={(value) => {
                  setUserPage(1);
                  setUserFilters((current) => ({ ...current, status: value as UserFilters["status"] }));
                }}
                options={["all", "active", "disabled", "deleted"]}
                value={userFilters.status}
              />
              <FilterSelect
                label="Role"
                onChange={(value) => {
                  setUserPage(1);
                  setUserFilters((current) => ({ ...current, role: value as UserFilters["role"] }));
                }}
                options={["all", "user", "admin"]}
                value={userFilters.role}
              />
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                Phase
                <input
                  className={inputClass}
                  onChange={(event) => {
                    setUserPage(1);
                    setUserFilters((current) => ({ ...current, currentPhase: event.target.value }));
                  }}
                  placeholder="stabilize"
                  value={userFilters.currentPhase}
                />
              </label>
              <FilterSelect
                label="Onboarding"
                onChange={(value) => {
                  setUserPage(1);
                  setUserFilters((current) => ({ ...current, onboardingComplete: value as BooleanFilter }));
                }}
                options={["all", "true", "false"]}
                value={userFilters.onboardingComplete}
              />
              <FilterSelect
                label="Baseline"
                onChange={(value) => {
                  setUserPage(1);
                  setUserFilters((current) => ({ ...current, baselineCompleted: value as BooleanFilter }));
                }}
                options={["all", "true", "false"]}
                value={userFilters.baselineCompleted}
              />
            </div>
          </div>

          {usersError ? <ErrorBanner message={usersError} /> : null}

          <div className="mt-5 overflow-x-auto rounded-[18px] border border-[#E8DFD1]">
            <div className="min-w-[980px]">
            <div className="hidden grid-cols-[minmax(230px,1.15fr)_minmax(230px,0.95fr)_minmax(230px,1fr)_minmax(250px,0.9fr)] gap-5 bg-[#F4EFE6] px-4 py-3 pr-6 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82] lg:grid">
              <span>User</span>
              <span>Account</span>
              <span>Journey</span>
              <span>Progress</span>
            </div>

            <div className="divide-y divide-[#E8DFD1] bg-white">
              {isUsersLoading ? <ListState icon={RefreshCw} message="Loading users..." /> : null}
              {!isUsersLoading && users.length === 0 ? <ListState icon={UserRound} message="No users match these filters." /> : null}
              {!isUsersLoading &&
                users.map((user) => {
                  const currentEditingUser = editingUserId === user.id ? editingUser : null;
                  const progressPercent = (Number(user.onboardingComplete) + Number(user.baselineCompleted)) * 50;

                  return (
                    <div className="px-4 py-4 pr-6 transition hover:bg-[#FBF7EF]/70" key={user.id}>
                      <div className="grid gap-5 lg:grid-cols-[minmax(230px,1.15fr)_minmax(230px,0.95fr)_minmax(230px,1fr)_minmax(250px,0.9fr)] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7E5DA] text-[#B85028]">
                            <UserCog aria-hidden="true" className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[#16352B]">{user.pseudonymousUserId}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#A89A82]">
                              <Clock3 aria-hidden="true" className="size-3.5" />
                              Joined {formatDateTime(user.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-[#E4ECE6] px-2.5 py-1 text-xs font-semibold capitalize text-[#12362C]">{user.role}</span>
                            <StatusBadge status={user.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className={cn(iconButtonClass, "h-9 border border-[#E4DBCE] bg-[#FBF7EF] px-3 text-xs text-[#7C7363] hover:border-[#CDBEA8] hover:text-[#16352B]", currentEditingUser ? "bg-[#F4EFE6] text-[#16352B]" : null)}
                              onClick={() => (currentEditingUser ? cancelEditing() : startEditing(user))}
                              type="button"
                            >
                              {currentEditingUser ? "Close edit" : "Edit"}
                            </button>
                            <button
                              className={cn(iconButtonClass, "h-9 border border-[#E8BDA9] bg-[#FFF7F3] px-3 text-xs text-[#B85028] hover:border-[#D89F87] disabled:bg-[#F4EFE6] disabled:text-[#A89A82]")}
                              disabled={user.status === "deleted" || deletingUserId === user.id}
                              onClick={() => setPendingDeleteUser(user)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" />
                              {deletingUserId === user.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>

                        <div className="min-w-0 rounded-2xl bg-[#FBF7EF] px-3 py-2">
                          <p className="truncate text-sm font-semibold text-[#16352B]">{user.currentPhase ? formatLabel(user.currentPhase) : "No phase set"}</p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-[#A89A82]">{user.currentModule ?? "No module assigned"}</p>
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="h-2 overflow-hidden rounded-full bg-[#E8DFD1]">
                            <div className="h-full rounded-full bg-[#B85028]" style={{ width: progressPercent + "%" }} />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <CompletionChip isComplete={user.onboardingComplete} label="Onboarding" />
                            <CompletionChip isComplete={user.baselineCompleted} label="Baseline" />
                          </div>
                        </div>
                      </div>

                      {currentEditingUser ? (
                        <div className="mt-4 rounded-[18px] border border-[#E8DFD1] bg-[#FBF7EF] p-4">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                              Preferred name
                              <input className={inputClass} onChange={(event) => updateEditingUser("preferredName", event.target.value)} placeholder="Set preferred name" value={currentEditingUser.preferredName} />
                            </label>
                            <EditSelect label="Role" onChange={(value) => updateEditingUser("role", value as UserRole)} options={["user", "admin"]} value={currentEditingUser.role} />
                            <EditSelect label="Status" onChange={(value) => updateEditingUser("status", value as UserStatus)} options={["active", "disabled", "deleted"]} value={currentEditingUser.status} />
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                              Phase
                              <input className={inputClass} onChange={(event) => updateEditingUser("currentPhase", event.target.value)} value={currentEditingUser.currentPhase} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
                              Module
                              <input className={inputClass} onChange={(event) => updateEditingUser("currentModule", event.target.value)} placeholder="Module" value={currentEditingUser.currentModule} />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap gap-3">
                              <ToggleField checked={currentEditingUser.onboardingComplete} label="Onboarding complete" onChange={(checked) => updateEditingUser("onboardingComplete", checked)} />
                              <ToggleField checked={currentEditingUser.baselineCompleted} label="Baseline complete" onChange={(checked) => updateEditingUser("baselineCompleted", checked)} />
                            </div>
                            <div className="flex gap-2">
                              <button
                                className={cn(iconButtonClass, "bg-[#12362C] text-[#F4EFE6] hover:bg-[#1B493B]")}
                                disabled={savingUserId === user.id}
                                onClick={() => void saveUser(user)}
                                type="button"
                              >
                                <Save aria-hidden="true" className="size-4" />
                                {savingUserId === user.id ? "Saving..." : "Save"}
                              </button>
                              <button className={cn(iconButtonClass, "border border-[#E4DBCE] bg-white text-[#7C7363] hover:text-[#16352B]")} onClick={cancelEditing} type="button">
                                <XCircle aria-hidden="true" className="size-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
            </div>
          </div>

          <PaginationControls
            currentPage={userPage}
            disabled={isUsersLoading}
            onNext={() => setUserPage((page) => page + 1)}
            onPrevious={() => setUserPage((page) => Math.max(1, page - 1))}
            pagination={userPagination}
            unit="users"
          />
        </article>

        <aside className="flex min-w-0 flex-col gap-5">
          <article className="rounded-[22px] bg-[#12362C] p-5 text-[#F4EFE6] shadow-[0_18px_40px_-34px_rgba(18,54,44,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#EDB879]">Invite</p>
                <h2 className="mt-1 font-serif text-3xl font-normal">Send invitation</h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#EDB879]">
                <UserPlus aria-hidden="true" className="size-5" />
              </span>
            </div>

            <form className="mt-5 space-y-3" onSubmit={createInvitation}>
              <input
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-[#F4EFE6] outline-none placeholder:text-[#C7D1C8] focus:border-[#EDB879]"
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="new-user@example.com"
                required
                type="email"
                value={inviteEmail}
              />
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-[#F4EFE6] outline-none focus:border-[#EDB879]"
                onChange={(event) => setInviteRole(event.target.value as UserRole)}
                value={inviteRole}
              >
                <option className="text-[#16352B]" value="user">User</option>
                <option className="text-[#16352B]" value="admin">Admin</option>
              </select>
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#B85028] px-4 text-sm font-semibold text-white shadow-[0_18px_34px_-24px_rgba(184,80,40,0.8)] transition hover:bg-[#A84624] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isInviting}
                type="submit"
              >
                <MailPlus aria-hidden="true" className="size-4" />
                {isInviting ? "Sending..." : "Send invite"}
              </button>
            </form>
            <p className="mt-4 text-sm leading-6 text-[#C7D1C8]">Backend sends the email and keeps the raw invite token hidden from admin.</p>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="sedona-eyebrow">Privacy</p>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Safe fields only</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#7C7363]">Existing users stay pseudonymized. This screen does not expose raw journals, reflections, chat messages, passwords, or invite tokens.</p>
          </article>

          <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
            <p className="sedona-eyebrow">Invites</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniStat label="Total" value={totalInvitations} />
              <MiniStat label="Pending" value={pendingInvitations} />
            </div>
          </article>
        </aside>
      </div>

      <article className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="sedona-eyebrow">Invitations</p>
            <h2 className="mt-1 font-serif text-3xl font-normal text-[#16352B]">Invitation list</h2>
            <p className="mt-1 text-sm leading-6 text-[#7C7363]">Pending invitations can be resent or revoked. Accepted, revoked, and expired records are read-only.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px]">
            <label className="relative block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A89A82]" />
              <input
                className="h-10 w-full rounded-full border border-[#E4DBCE] bg-[#FBF7EF] pl-9 pr-3 text-sm font-semibold text-[#16352B] outline-none placeholder:text-[#A89A82] focus:border-[#B85028] focus:bg-white"
                onChange={(event) => {
                  setInvitationPage(1);
                  setInvitationFilters((current) => ({ ...current, email: event.target.value }));
                }}
                placeholder="Filter email"
                type="email"
                value={invitationFilters.email}
              />
            </label>
            <select
              className={selectClass}
              onChange={(event) => {
                setInvitationPage(1);
                setInvitationFilters((current) => ({ ...current, status: event.target.value as InvitationFilters["status"] }));
              }}
              value={invitationFilters.status}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {invitationsError ? <ErrorBanner message={invitationsError} /> : null}

        <div className="mt-5 overflow-hidden rounded-[18px] border border-[#E8DFD1]">
          <div className="hidden grid-cols-[minmax(260px,1.25fr)_150px_minmax(220px,1fr)_180px] gap-4 bg-[#F4EFE6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82] lg:grid">
            <span>Invitation</span>
            <span>Status</span>
            <span>Timeline</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-[#E8DFD1] bg-white">
            {isInvitationsLoading ? <ListState icon={RefreshCw} message="Loading invitations..." /> : null}
            {!isInvitationsLoading && invitations.length === 0 ? <ListState icon={MailPlus} message="No invitations match these filters." /> : null}
            {!isInvitationsLoading &&
              invitations.map((invitation) => {
                const canResend = invitation.status === "pending" || invitation.status === "expired";
                const canRevoke = invitation.status === "pending";
                const isActing = actingInvitationId === invitation.id;

                return (
                  <div className="grid gap-4 px-4 py-4 transition hover:bg-[#FBF7EF]/70 lg:grid-cols-[minmax(260px,1.25fr)_150px_minmax(220px,1fr)_180px] lg:items-center" key={invitation.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7E5DA] text-[#B85028]">
                        <MailPlus aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#16352B]">{invitation.email}</p>
                        <p className="mt-1 text-xs font-semibold capitalize text-[#A89A82]">Role: {invitation.role}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={invitation.status} />
                    </div>

                    <div className="grid gap-1 text-xs font-semibold text-[#7C7363] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <span>Created {formatDateTime(invitation.createdAt)}</span>
                      <span>Expires {formatDateTime(invitation.expiresAt)}</span>
                      <span>Updated {formatDateTime(invitation.updatedAt)}</span>
                      <span>{invitation.acceptedAt ? "Accepted " + formatDateTime(invitation.acceptedAt) : invitation.revokedAt ? "Revoked " + formatDateTime(invitation.revokedAt) : "Awaiting response"}</span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <button
                        className={cn(iconButtonClass, "border border-[#E4DBCE] bg-[#FBF7EF] text-[#7C7363] hover:border-[#CDBEA8] hover:text-[#16352B]")}
                        disabled={!canResend || isActing}
                        onClick={() => void actOnInvitation(invitation, "resend")}
                        type="button"
                      >
                        <RotateCw aria-hidden="true" className="size-4" />
                        Resend
                      </button>
                      <button
                        className={cn(iconButtonClass, "border border-[#E8BDA9] bg-[#FFF7F3] text-[#B85028] hover:border-[#D89F87]")}
                        disabled={!canRevoke || isActing}
                        onClick={() => void actOnInvitation(invitation, "revoke")}
                        type="button"
                      >
                        <XCircle aria-hidden="true" className="size-4" />
                        Revoke
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <PaginationControls
          currentPage={invitationPage}
          disabled={isInvitationsLoading}
          onNext={() => setInvitationPage((page) => page + 1)}
          onPrevious={() => setInvitationPage((page) => Math.max(1, page - 1))}
          pagination={invitationPagination}
          unit="invitations"
        />
      </article>

      <Dialog
        open={Boolean(pendingDeleteUser)}
        onOpenChange={(open) => {
          if (!open && !deletingUserId) {
            setPendingDeleteUser(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-[#FFF7F3] text-[#B85028]">
              <AlertTriangle aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will mark {pendingDeleteUser?.pseudonymousUserId ?? "this user"} as deleted and revoke active sessions. The account remains pseudonymized for admin history and reporting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className={cn(iconButtonClass, "border border-[#E4DBCE] bg-white text-[#7C7363] hover:text-[#16352B]")}
              disabled={Boolean(deletingUserId)}
              onClick={() => setPendingDeleteUser(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={cn(iconButtonClass, "bg-[#B85028] text-white hover:bg-[#9D431F]")}
              disabled={!pendingDeleteUser || Boolean(deletingUserId)}
              onClick={() => {
                if (pendingDeleteUser) {
                  void deleteUser(pendingDeleteUser);
                }
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {deletingUserId ? "Deleting..." : "Delete user"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MetricCard({ tile }: { tile: MetricTile }) {
  const Icon = tile.icon;

  return (
    <article className="rounded-[18px] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(48,30,16,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <span className={cn("flex size-11 items-center justify-center rounded-2xl", toneClasses[tile.tone])}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="rounded-full bg-[#F4EFE6] px-3 py-1 text-xs font-semibold text-[#7C7363]">Live</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-[#7C7363]">{tile.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-serif text-4xl font-normal leading-none text-[#16352B]">{tile.value}</p>
        <p className="pb-1 text-right text-sm font-semibold text-[#A89A82]">{tile.helper}</p>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[#FBF7EF] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#A89A82]">{label}</p>
      <p className="mt-1 font-serif text-3xl text-[#16352B]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus | InvitationStatus }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusClasses[status])}>{formatLabel(status)}</span>;
}

function CompletionChip({ isComplete, label }: { isComplete: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", isComplete ? "bg-[#E4EFE8] text-[#3E7A5E]" : "bg-[#F4EFE6] text-[#A89A82]")}>
      <CheckCircle2 aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

function ToggleField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E4DBCE] bg-white px-3 py-2 text-sm font-semibold text-[#7C7363]">
      <input checked={checked} className="size-4 accent-[#B85028]" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function FilterSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
      {label}
      <select className={selectClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A89A82]">
      {label}
      <select className={selectClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#E8BDA9] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-[#B85028]">
      <XCircle aria-hidden="true" className="size-4" />
      {message}
    </div>
  );
}

function ListState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-sm font-semibold text-[#7C7363]">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F4EFE6] text-[#B85028]">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      {message}
    </div>
  );
}

function PaginationControls({
  currentPage,
  disabled,
  onNext,
  onPrevious,
  pagination,
  unit,
}: {
  currentPage: number;
  disabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  pagination: Pagination | null;
  unit: string;
}) {
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const total = pagination?.total ?? 0;

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-[#7C7363]">
        {total} {unit} - page {pagination?.page ?? currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button className={cn(iconButtonClass, "border border-[#E4DBCE] bg-[#FBF7EF] text-[#7C7363]")} disabled={currentPage <= 1 || disabled} onClick={onPrevious} type="button">
          Previous
        </button>
        <button className={cn(iconButtonClass, "border border-[#E4DBCE] bg-[#FBF7EF] text-[#7C7363]")} disabled={!pagination || currentPage >= totalPages || disabled} onClick={onNext} type="button">
          Next
        </button>
      </div>
    </div>
  );
}

function formatOptionLabel(value: string) {
  if (value === "all") {
    return "All";
  }

  if (value === "true") {
    return "Complete";
  }

  if (value === "false") {
    return "Open";
  }

  return formatLabel(value);
}
