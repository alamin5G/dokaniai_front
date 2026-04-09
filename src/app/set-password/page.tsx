"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";
import { useAuthStore } from "@/store/authStore";

export default function SetPasswordPage() {
  const router = useRouter();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorText("পাসওয়ার্ড দুটি মিলছে না");
      return;
    }
    if (password.length < 6) {
      setErrorText("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে");
      return;
    }
    
    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/set-password", {
        newPassword: password,
        confirmPassword: confirmPassword
      });

      // Clear the temporary tokens securely since they need to login properly
      clearTokens();
      router.push("/login?passwordSet=true");
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "পাসওয়ার্ড সেট করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="নতুন পাসওয়ার্ড সেট করুন" 
      subheading="ভবিষ্যতে লগইন করার জন্য একটি পাসওয়ার্ড নির্ধারণ করুন"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput 
          label="নতুন পাসওয়ার্ড"
          type="password"
          placeholder="আপনার নতুন পাসওয়ার্ড দিন"
          icon="lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <FormInput 
          label="পাসওয়ার্ড নিশ্চিত করুন"
          type="password"
          placeholder="আবারও পাসওয়ার্ডটি লিখুন"
          icon="lock"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}

        <GradientButton type="submit" loading={isLoading}>
          <span>সেভ করুন</span>
          <span className="material-symbols-outlined">save</span>
        </GradientButton>
      </form>
    </AuthLayout>
  );
}
