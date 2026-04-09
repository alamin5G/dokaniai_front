"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorText("মোবাইল নম্বর বা ইমেইল দিন");
      return;
    }
    
    setErrorText("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", {
        phoneOrEmail: identifier
      });

      router.push(`/reset-password?contact=${encodeURIComponent(identifier)}`);
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "OTP পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="পাসওয়ার্ড ভুলে গেছেন?" 
      subheading="আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইল দিন। আমরা একটি ওটিপি পাঠাবো।"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput 
          label="মোবাইল নম্বর বা ইমেইল"
          type="text"
          placeholder="017... অথবা email@example.com"
          icon="account_circle"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        {errorText && <p className="text-error text-sm font-semibold text-center">{errorText}</p>}

        <GradientButton loading={isLoading} type="submit">
          <span>OTP পাঠান</span>
          <span className="material-symbols-outlined text-xl" data-icon="send">send</span>
        </GradientButton>
      </form>
      
      <div className="text-center mt-8">
        <button 
          onClick={() => router.push("/login")}
          className="text-on-surface-variant font-medium hover:text-primary transition-colors"
        >
          লগইন পেজে ফিরে যান
        </button>
      </div>
    </AuthLayout>
  );
}
