"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import apiClient from "@/lib/api";
import { getOrCreateClientDeviceId } from "@/lib/device";
import { getApiErrorMessage } from "@/lib/apiError";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
type LoginMethod = "PASSWORD" | "OTP" | "GOOGLE" | "FACEBOOK";

interface Session {
  id: string;
  userId: string;
  sessionType: "WEB" | "MOBILE_APP" | "API";
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  userAgent: string;
  ipAddress: string;
  loginMethod: LoginMethod;
  mfaUsed: boolean;
  lastActivityAt: string;
  expiresAt: string;
  isRevoked: boolean;
  createdAt: string;
}

interface SessionsResponse {
  success: boolean;
  data: {
    count: number;
    sessions: Session[];
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getDeviceIcon(deviceType: DeviceType): string {
  switch (deviceType) {
    case "DESKTOP":
      return "laptop_mac";
    case "MOBILE":
      return "smartphone";
    case "TABLET":
      return "devices_other";
    default:
      return "devices_other";
  }
}

function getRelativeTime(
  isoDate: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (diffMs < 60_000) {
    return t("timeAgo.justNow");
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return t("timeAgo.minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t("timeAgo.hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  return t("timeAgo.daysAgo", { count: diffDays });
}

function getLoginMethodLabel(
  method: LoginMethod,
  t: (key: string) => string,
): string {
  switch (method) {
    case "PASSWORD":
      return t("password");
    case "OTP":
      return t("otp");
    case "GOOGLE":
      return t("google");
    case "FACEBOOK":
      return t("facebook");
    default:
      return method;
  }
}

/* ------------------------------------------------------------------ */
/*  Confirm Dialog                                                     */
/* ------------------------------------------------------------------ */

function ConfirmDialog({
  open,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <p className="text-on-surface text-lg font-hind-siliguri mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-error text-on-error font-bold hover:bg-error/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function SessionsPage() {
  const router = useRouter();
  const t = useTranslations("sessions");
  const { accessToken, clearTokens } = useAuthStore();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Confirm dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogAction, setDialogAction] = useState<(() => void) | null>(null);

  const currentDeviceId = getOrCreateClientDeviceId();

  /* ---------- Fetch sessions ---------- */

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<SessionsResponse>("/auth/sessions");
      setSessions(response.data.data.sessions);
    } catch (err) {
      setError(getApiErrorMessage(err, t("errorFetch")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    fetchSessions();
  }, [accessToken, router, fetchSessions]);

  /* ---------- Revoke single session ---------- */

  const handleRevoke = useCallback(
    (sessionId: string) => {
      setDialogMessage(t("revokeConfirm"));
      setDialogAction(() => async () => {
        try {
          setRevokingId(sessionId);
          await apiClient.delete(`/auth/sessions/${sessionId}`);
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch (err) {
          setError(getApiErrorMessage(err, t("errorRevoke")));
        } finally {
          setRevokingId(null);
          setDialogOpen(false);
          setDialogAction(null);
        }
      });
      setDialogOpen(true);
    },
    [t],
  );

  /* ---------- Logout all devices ---------- */

  const handleLogoutAll = useCallback(() => {
    setDialogMessage(t("logoutAllConfirm"));
    setDialogAction(() => async () => {
      try {
        await apiClient.post("/auth/logout/all");
      } catch {
        // Even if API call fails, clear local tokens and redirect
      } finally {
        clearTokens();
        router.replace("/login");
        setDialogOpen(false);
        setDialogAction(null);
      }
    });
    setDialogOpen(true);
  }, [t, clearTokens, router]);

  /* ---------- Auth guard ---------- */

  if (!accessToken) {
    return null;
  }

  /* ---------- Loading state ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-hind-siliguri">
            {t("errorFetch").slice(0, 10)}...
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* ── Top Bar ── */}
      <header className="bg-surface-container border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-xl">
                book_2
              </span>
            </div>
            <h1 className="text-xl font-bold text-primary">DokaniAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
              <span className="font-medium text-sm hidden sm:inline">
                {t("backToDashboard")}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
              {t("heading")}
            </h1>
            {sessions.length > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {t("countBadge", { count: sessions.length })}
              </span>
            )}
          </div>
          <p className="text-lg text-on-surface-variant max-w-2xl font-hind-siliguri leading-relaxed">
            {t("subheading")}
          </p>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-error-container/30 text-on-error-container p-4 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="font-hind-siliguri">{error}</span>
            <button
              className="ml-auto text-on-error-container hover:bg-error-container/50 p-1 rounded-full"
              onClick={() => setError(null)}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Session Alert / Global Action */}
        {sessions.length > 0 && (
          <div className="mb-10 bg-surface-container-low p-8 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all">
            <div>
              <h3 className="text-xl font-bold text-primary mb-1">
                {t("securityAlert")}
              </h3>
              <p className="text-on-surface-variant font-hind-siliguri">
                {t("securityAlertDesc")}
              </p>
            </div>
            <button
              onClick={handleLogoutAll}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-lg font-bold shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            >
              {t("logoutAll")}
            </button>
          </div>
        )}

        {/* No Sessions */}
        {!loading && sessions.length === 0 && !error && (
          <div className="text-center py-16 bg-surface-container-low rounded-2xl">
            <span className="material-symbols-outlined text-primary text-6xl mb-4 block">
              devices_off
            </span>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {t("noSessions")}
            </h3>
          </div>
        )}

        {/* Session List (Bento-style Grid) */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => {
              const isCurrentDevice =
                currentDeviceId &&
                session.deviceId === currentDeviceId;

              return (
                <div
                  key={session.id}
                  className={`bg-surface-container-lowest p-6 rounded-lg shadow-sm transition-all ${
                    isCurrentDevice
                      ? "border-l-4 border-primary"
                      : "hover:translate-y-[-4px]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrentDevice
                          ? "bg-primary-fixed"
                          : session.deviceType === "MOBILE"
                            ? "bg-secondary-fixed"
                            : "bg-surface-container-highest"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined ${
                          isCurrentDevice
                            ? "text-primary"
                            : session.deviceType === "MOBILE"
                              ? "text-secondary"
                              : "text-outline"
                        }`}
                        style={{ fontVariationSettings: isCurrentDevice ? "'FILL' 1" : undefined }}
                      >
                        {getDeviceIcon(session.deviceType)}
                      </span>
                    </div>
                    {isCurrentDevice ? (
                      <span className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {t("currentDevice")}
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant opacity-60">
                        {session.sessionType === "MOBILE_APP"
                          ? "Mobile App"
                          : session.sessionType === "API"
                            ? "API"
                            : "Web"}
                      </span>
                    )}
                  </div>

                  {/* Device Name */}
                  <h4 className="text-xl font-bold text-on-surface mb-2">
                    {session.deviceName || "Unknown Device"}
                  </h4>

                  {/* Session Details */}
                  <div className="space-y-2 mb-8 font-hind-siliguri text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        public
                      </span>
                      <span>
                        {t("ipAddress")}: {session.ipAddress}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        schedule
                      </span>
                      <span>
                        {isCurrentDevice
                          ? `${t("active")}: ${getRelativeTime(session.lastActivityAt, t)}`
                          : `${t("lastActive")}: ${getRelativeTime(session.lastActivityAt, t)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        key
                      </span>
                      <span>
                        {t("loginMethod")}: {getLoginMethodLabel(session.loginMethod, t)}
                      </span>
                    </div>
                  </div>

                  {/* Revoke Button */}
                  <div className="pt-4 border-t border-surface-container flex justify-end">
                    {isCurrentDevice ? (
                      <button
                        disabled
                        className="text-outline font-semibold opacity-50 cursor-not-allowed"
                      >
                        {t("revoke")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevoke(session.id)}
                        disabled={revokingId === session.id}
                        className="text-tertiary font-bold hover:bg-error-container/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {revokingId === session.id ? (
                          <span className="material-symbols-outlined animate-spin text-lg">
                            progress_activity
                          </span>
                        ) : (
                          t("revoke")
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Glassmorphism AI Insight Card */}
            <div className="md:col-span-1 bg-surface-variant/60 backdrop-blur-xl p-8 rounded-lg flex flex-col justify-between border border-white/20">
              <div>
                <div className="flex items-center gap-3 text-secondary-container mb-4">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <span className="font-bold uppercase tracking-tighter text-sm">
                    {t("aiInsight")}
                  </span>
                </div>
                <p className="text-on-surface-variant font-hind-siliguri text-lg italic leading-relaxed">
                  &ldquo;{t("aiInsightText")}&rdquo;
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim/30" />
                <span className="w-2 h-2 rounded-full bg-primary-fixed-dim/30" />
              </div>
            </div>
          </div>
        )}

        {/* Footer Metadata */}
        <div className="mt-16 text-center text-on-surface-variant font-hind-siliguri opacity-60">
          <p className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">shield</span>
            {t("securityTip")}: {t("securityTipText")}
          </p>
        </div>
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogOpen}
        message={dialogMessage}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          dialogAction?.();
        }}
        onCancel={() => {
          setDialogOpen(false);
          setDialogAction(null);
        }}
      />
    </div>
  );
}
