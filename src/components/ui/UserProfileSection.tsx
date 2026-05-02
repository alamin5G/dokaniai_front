"use client";

import apiClient from "@/lib/api";
import { getCurrentUser, type CurrentUser } from "@/lib/userAccountApi";
import { useAuthStore } from "@/store/authStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

const AVATAR_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-tertiary",
  "bg-error",
  "bg-surface-container-highest",
];

function getInitial(name: string | null | undefined, phone: string | null | undefined): string {
  if (name && name.trim()) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (phone && phone.trim()) {
    return phone.trim().charAt(0);
  }
  return "?";
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getDisplayName(user: CurrentUser): string {
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.phone) return user.phone;
  if (user.email) return user.email;
  return "...";
}

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-modal-backdrop-in"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative bg-surface-container-lowest rounded-[1.5rem] p-6 max-w-sm w-full shadow-2xl animate-modal-content-in border border-outline-variant/20">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
            <IconLogout className="w-6 h-6 text-error" />
          </div>
        </div>
        {/* Message */}
        <p className="text-on-surface text-center text-lg font-semibold mb-6">{message}</p>
        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold bg-surface-container-high text-on-surface transition-all hover:bg-surface-container-highest active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #ba1a1a 0%, #dc2626 100%)" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function IconProfile({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconSubscription({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function IconSessions({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconLogout({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

export interface UserProfileSectionProps {
  variant?: "header" | "compact";
}

export default function UserProfileSection({ variant = "header" }: UserProfileSectionProps) {
  const router = useRouter();
  const t = useTranslations("userProfile");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = (attempt = 0) => {
      getCurrentUser()
        .then((data) => {
          if (!cancelled) setUser(data);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 2) {
            setTimeout(() => fetchUser(attempt + 1), 800);
          }
        });
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore — clear tokens locally even if server call fails
    }
    useAuthStore.getState().clearTokens();
    router.replace("/login");
  }, [router]);

  const fallbackName = useAuthStore((s) => s.userId);
  const displayName = user ? getDisplayName(user) : (fallbackName ?? "").slice(0, 8) || t("loading");
  const initial = user ? getInitial(user.name, user.phone) : fallbackName?.charAt(0).toUpperCase() || "?";
  const avatarColor = user ? getAvatarColor(user.name) : "bg-primary";

  const isCompact = variant === "compact";

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full hover:bg-surface-container-high/60 transition-colors px-2 py-1.5"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <div className={`w-8 h-8 ${isCompact ? "w-7 h-7" : ""} rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {initial}
          </div>
          {!isCompact && (
            <span className="hidden sm:inline-block max-w-28 truncate text-sm font-semibold text-on-surface">
              {displayName}
            </span>
          )}
          {!isCompact && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-on-surface-variant transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container-lowest py-1.5 shadow-xl z-50 border border-surface-container">
            <div className="px-4 py-3 border-b border-surface-container">
              <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
              {user?.email && (
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
              )}
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => { setIsDropdownOpen(false); router.push("/account/profile"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <IconProfile className="w-4 h-4 text-on-surface-variant" />
                {t("profile")}
              </button>
              <button
                type="button"
                onClick={() => { setIsDropdownOpen(false); router.push("/account/subscription"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <IconSubscription className="w-4 h-4 text-on-surface-variant" />
                {t("subscription")}
              </button>
              <button
                type="button"
                onClick={() => { setIsDropdownOpen(false); router.push("/sessions"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <IconSessions className="w-4 h-4 text-on-surface-variant" />
                {t("sessions")}
              </button>
            </div>

            <div className="border-t border-surface-container pt-1">
              <button
                type="button"
                onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
              >
                <IconLogout className="w-4 h-4" />
                {t("logout")}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        message={t("logoutConfirm")}
        confirmLabel={t("yes")}
        cancelLabel={t("no")}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
