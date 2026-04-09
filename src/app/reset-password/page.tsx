"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get("contact") || "";
  
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendOtp = async () => {
    setCountdown(60);
    // Trigger /auth/forgot-password again
    // await apiClient.post("/auth/forgot-password", { phoneOrEmail: contact });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorText("অনুগ্রহ করে সঠিক OTP দিন");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText("পাসওয়ার্ড দুটি মিলছে না");
      return;
    }
    if (newPassword.length < 6) {
      setErrorText("পাসওয়ার্ড অন্তত ۶ অক্ষরের হতে হবে");
      return;
    }
    
    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        phoneOrEmail: contact,
        otp,
        newPassword
      });

      router.push("/login?resetSuccess=true");
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-on-surface-variant font-medium">
          {contact} এ পাঠানো ৬-ডিজিটের OTP কোডটি লিখুন
        </p>
      </div>

      <FormInput 
        label="OTP কোড"
        type="text"
        placeholder="----"
        icon="pin"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <FormInput 
        label="নতুন পাসওয়ার্ড"
        type="password"
        placeholder="আপনার নতুন পাসওয়ার্ড দিন"
        icon="lock"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      
      <FormInput 
        label="পাসওয়ার্ড নিশ্চিত করুন"
        type="password"
        placeholder="আবারও পাসওয়ার্ডটি লিখুন"
        icon="lock"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {errorText && <p className="text-error text-sm font-semibold text-center">{errorText}</p>}

      <GradientButton type="submit" loading={isLoading}>
        <span>পাসওয়ার্ড রিসেট করুন</span>
        <span className="material-symbols-outlined">restart_alt</span>
      </GradientButton>

      <div className="text-center mt-6">
        <button 
          type="button" 
          disabled={countdown > 0}
          onClick={handleResendOtp}
          className={`font-bold transition-colors ${countdown > 0 ? "text-on-surface-variant opacity-50 cursor-not-allowed" : "text-primary hover:underline"}`}
        >
          {countdown > 0 ? `পুনরায় OTP পাঠান (${countdown}s)` : "পুনরায় OTP পাঠান"}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      heading="পাসওয়ার্ড রিসেট করুন" 
      subheading="OTP যাচাই করুন এবং আপনার নতুন পাসওয়ার্ড সেট করুন"
    >
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
