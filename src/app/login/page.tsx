"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    
    if (!identifier || !password) {
      setErrorText("অনুগ্রহ করে আপনার আইডি এবং পাসওয়ার্ড দিন");
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await apiClient.post("/auth/login", {
        phoneOrEmail: identifier,
        password,
        deviceId: "web-client",
        deviceInfo: navigator.userAgent
      });
      
      const { accessToken, refreshToken, user, status } = res.data.data;
      setTokens(accessToken, refreshToken, user?.id || "", status);
      
      // Navigate straight to dashboard after successful login
      router.push("/dashboard");
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "লগইন তথ্য ভুল হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="লগইন করুন" 
      subheading="আপনার মোবাইল নম্বর বা ইমেল এবং পাসওয়ার্ড ব্যবহার করে প্রবেশ করুন"
    >
      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <FormInput 
          label="মোবাইল বা ইমেইল"
          type="text"
          placeholder="017... অথবা email@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-on-surface-variant flex-grow">পাসওয়ার্ড</label>
            <Link href="/forgot-password" className="text-secondary font-bold text-sm tracking-wide hover:underline text-right shrink-0">
              ভুলে গেছেন?
            </Link>
          </div>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-xl" data-icon="lock">
              lock
            </span>
            <input 
              type="password"
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-surface-container-lowest rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 font-medium transition-all shadow-sm group-focus-within:shadow-md outline-none"
              placeholder="আপনার পাসওয়ার্ড দিন"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {errorText && <p className="text-error text-sm font-semibold text-center">{errorText}</p>}
        
        <GradientButton loading={isLoading} type="submit">
          <span>লগইন করুন</span>
          <span className="material-symbols-outlined text-xl" data-icon="arrow_forward">arrow_forward</span>
        </GradientButton>
      </form>
      
      <div className="my-8 flex items-center gap-4">
        <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
        <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">অথবা</span>
        <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
      </div>
      
      <div className="text-center">
        <p className="text-on-surface-variant font-medium">
          নতুন অ্যাকাউন্ট খুলতে চান? 
          <Link href="/register" className="text-secondary font-bold hover:underline ml-1">এখানে ক্লিক করুন</Link>
        </p>
      </div>  
    </AuthLayout>
  );
}
