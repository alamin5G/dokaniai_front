"use client";

import { FormInput } from "@/components/ui/FormPrimitives";
import {
  changePassword,
  getCurrentUser,
  requestPhoneChange,
  updateCurrentUser,
  verifyPhoneChange,
} from "@/lib/userAccountApi";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export default function AccountProfilePage() {
  const locale = useLocale();
  const isBn = locale.startsWith("bn");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setPhone(user.phone ?? "");
        setRole(user.role ?? "");
        setStatus(user.status ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Profile load failed");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setNotice(null);
    try {
      await updateCurrentUser({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      setNotice(isBn ? "প্রোফাইল আপডেট হয়েছে।" : "Profile updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError(isBn ? "বর্তমান ও নতুন পাসওয়ার্ড দিন।" : "Provide current and new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(isBn ? "নতুন পাসওয়ার্ড মিলছে না।" : "New password confirmation does not match.");
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
      setNotice(isBn ? "পাসওয়ার্ড পরিবর্তন হয়েছে।" : "Password changed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!newPhone.trim()) {
      setError(isBn ? "নতুন ফোন নম্বর দিন।" : "Provide new phone number.");
      return;
    }
    setSavingPhone(true);
    setError(null);
    setNotice(null);
    try {
      await requestPhoneChange(newPhone.trim());
      setOtpRequested(true);
      setNotice(isBn ? "OTP পাঠানো হয়েছে।" : "OTP sent to new phone.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP request failed");
    } finally {
      setSavingPhone(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (!newPhone.trim() || !phoneOtp.trim()) {
      setError(isBn ? "ফোন ও OTP দিন।" : "Provide phone and OTP.");
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
      setNotice(isBn ? "ফোন নম্বর আপডেট হয়েছে।" : "Phone number updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Phone verify failed");
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-surface p-8 text-on-surface">Loading profile...</main>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6">
        <h1 className="text-2xl font-bold text-on-surface">{isBn ? "ইউজার প্রোফাইল" : "User Profile"}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isBn ? "অ্যাকাউন্ট তথ্য, পাসওয়ার্ড এবং ফোন নম্বর ম্যানেজ করুন।" : "Manage account info, password, and phone number."}
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Role: {role || "-"} | Status: {status || "-"}
        </p>
      </section>

      {notice ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-700">{error}</div> : null}

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{isBn ? "বেসিক তথ্য" : "Basic info"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label={isBn ? "নাম" : "Name"} value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label={isBn ? "ইমেইল" : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput label={isBn ? "বর্তমান ফোন" : "Current phone"} value={phone} readOnly />
        </div>
        <button
          type="button"
          onClick={saveProfile}
          disabled={savingProfile}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingProfile ? (isBn ? "সেভ হচ্ছে..." : "Saving...") : (isBn ? "প্রোফাইল সেভ" : "Save profile")}
        </button>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{isBn ? "পাসওয়ার্ড পরিবর্তন" : "Change password"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FormInput type="password" label={isBn ? "বর্তমান পাসওয়ার্ড" : "Current password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <FormInput type="password" label={isBn ? "নতুন পাসওয়ার্ড" : "New password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <FormInput type="password" label={isBn ? "নতুন পাসওয়ার্ড নিশ্চিত" : "Confirm new password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={savePassword}
          disabled={savingPassword}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {savingPassword ? (isBn ? "আপডেট হচ্ছে..." : "Updating...") : (isBn ? "পাসওয়ার্ড আপডেট" : "Update password")}
        </button>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-on-surface">{isBn ? "ফোন নম্বর পরিবর্তন (OTP)" : "Change phone (OTP)"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label={isBn ? "নতুন ফোন নম্বর" : "New phone"} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <FormInput label="OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={sendPhoneOtp}
            disabled={savingPhone}
            className="rounded-full bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-50"
          >
            {isBn ? "OTP পাঠান" : "Send OTP"}
          </button>
          <button
            type="button"
            onClick={confirmPhoneChange}
            disabled={savingPhone || !otpRequested}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isBn ? "ফোন নিশ্চিত করুন" : "Verify phone change"}
          </button>
        </div>
      </section>
    </main>
  );
}
