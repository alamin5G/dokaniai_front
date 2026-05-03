"use client";

import ReferralCodeCard from "@/components/account/ReferralCodeCard";
import { PlanFeatureList } from "@/components/subscription/PlanFeatureList";
import { FormInput } from "@/components/ui/FormPrimitives";
import { getCurrentSubscription } from "@/lib/subscriptionApi";
import {
  changePassword,
  getCurrentUser,
  requestEmailChange,
  requestPhoneChange,
  updateCurrentUser,
  verifyEmailChange,
  verifyPhoneChange,
} from "@/lib/userAccountApi";
import type { Subscription } from "@/types/subscription";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function AccountProfilePage() {
  const t = useTranslations("profilePage");
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [user, currentSubscription] = await Promise.all([
          getCurrentUser(),
          getCurrentSubscription().catch(() => null),
        ]);
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setPhone(user.phone ?? "");
        setRole(user.role ?? "");
        setStatus(user.status ?? "");
        setSubscription(currentSubscription);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Profile load failed");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const saveProfile = async () => {
    setError(null);
    setNotice(null);
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSavingProfile(true);
    try {
      await updateCurrentUser({
        name: name.trim(),
      });
      setNotice(t("profileUpdated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError(t("providePasswords"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    setError(null);
    setNotice(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(t("passwordChanged"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!newPhone.trim()) {
      setError(t("newPhoneRequired"));
      return;
    }
    setSavingPhone(true);
    setError(null);
    setNotice(null);
    try {
      await requestPhoneChange(newPhone.trim());
      setOtpRequested(true);
      setNotice(t("otpSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP request failed");
    } finally {
      setSavingPhone(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (!newPhone.trim() || !phoneOtp.trim()) {
      setError(t("phoneAndOtpRequired"));
      return;
    }
    setSavingPhone(true);
    setError(null);
    setNotice(null);
    try {
      await verifyPhoneChange(newPhone.trim(), phoneOtp.trim());
      setPhone(newPhone.trim());
      setNewPhone("");
      setPhoneOtp("");
      setOtpRequested(false);
      setNotice(t("phoneUpdated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Phone verify failed");
    } finally {
      setSavingPhone(false);
    }
  };

  const sendEmailCode = async () => {
    if (!newEmail.trim()) {
      setError(t("newEmailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setError(t("validEmailRequired"));
      return;
    }
    setSavingEmail(true);
    setError(null);
    setNotice(null);
    try {
      await requestEmailChange(newEmail.trim());
      setEmailOtpRequested(true);
      setNotice(t("emailCodeSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email change request failed");
    } finally {
      setSavingEmail(false);
    }
  };

  const confirmEmailChange = async () => {
    if (!newEmail.trim() || !emailToken.trim()) {
      setError(t("emailAndCodeRequired"));
      return;
    }
    setSavingEmail(true);
    setError(null);
    setNotice(null);
    try {
      await verifyEmailChange(newEmail.trim(), emailToken.trim());
      setEmail(newEmail.trim());
      setNewEmail("");
      setEmailToken("");
      setEmailOtpRequested(false);
      setNotice(t("emailUpdated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email verify failed");
    } finally {
      setSavingEmail(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-surface p-8 text-on-surface">Loading profile...</main>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t("subtitle")}
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          {t("roleStatus", { role: role || "-", status: status || "-" })}
        </p>
      </section>

      {notice ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">{error}</div> : null}

      {subscription?.plan ? (
        <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                {isBn ? "আপনার সাবস্ক্রিপশন ফিচার" : "Your Subscription Features"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isBn ? subscription.plan.displayNameBn : subscription.plan.displayNameEn}
              </p>
            </div>
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {subscription.billingCycle === "ANNUAL" ? (isBn ? "বার্ষিক" : "Annual") : (isBn ? "মাসিক" : "Monthly")}
            </span>
          </div>
          <PlanFeatureList plan={subscription.plan} isBn={isBn} maxItems={8} />
        </section>
      ) : null}

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{t("basicInfo")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label={t("currentEmail")} value={email} readOnly />
          <FormInput label={t("currentPhone")} value={phone} readOnly />
        </div>
        <button
          type="button"
          onClick={saveProfile}
          disabled={savingProfile}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingProfile ? t("saving") : t("saveProfile")}
        </button>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{t("changePassword")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FormInput type="password" label={t("currentPassword")} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <FormInput type="password" label={t("newPassword")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <FormInput type="password" label={t("confirmNewPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={savePassword}
          disabled={savingPassword}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingPassword ? t("updating") : t("updatePassword")}
        </button>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{t("changePhone")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label={t("newPhone")} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <FormInput label={t("otp")} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={sendPhoneOtp}
            disabled={savingPhone}
            className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
          >
            {t("sendOtp")}
          </button>
          <button
            type="button"
            onClick={confirmPhoneChange}
            disabled={savingPhone || !otpRequested}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("verifyPhoneChange")}
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{t("changeEmail")}</h2>
        <p className="text-xs text-on-surface-variant">
          {t("changeEmailDesc")}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label={t("newEmail")} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <FormInput label={t("verificationCode")} value={emailToken} onChange={(e) => setEmailToken(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={sendEmailCode}
            disabled={savingEmail}
            className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
          >
            {t("sendCode")}
          </button>
          <button
            type="button"
            onClick={confirmEmailChange}
            disabled={savingEmail || !emailOtpRequested}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("verifyEmailChange")}
          </button>
        </div>
      </section>

      {/* Referral Program — self-contained card with copy/share */}
      <ReferralCodeCard />
    </main>
  );
}
