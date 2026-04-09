"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setErrorText("অনুগ্রহ করে শর্তাবলীতে সম্মত হোন");
      return;
    }
    setErrorText("");
    setIsLoading(true);

    try {
      if (tab === "phone") {
        // Backend DTO exactly matches these keys: phone, name, referralCode (optional)
        // Note: Password and ShopName are not passed during Phone Registration (password is set after OTP, Shop is created later)
        await apiClient.post("/auth/register/phone", {
          phone,
          name: fullName
        });
        
        // Since shopName needs to be created, we might store it in localStorage to complete the flow later
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingShopName", shopName);
        }
      } else {
        // Email requires password upfront.
        await apiClient.post("/auth/register/email", {
          email,
          phone,
          name: fullName,
          password
        });
        
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingShopName", shopName);
        }
      }
      if (tab === "phone") {
        router.push(`/verify-otp?contact=${encodeURIComponent(phone)}&method=phone`);
      } else {
        router.push("/login?registered=true");
      }
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "একটি ত্রুটি ঘটেছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="নতুন অ্যাকাউন্ট তৈরি করুন" 
      subheading="আপনার ব্যবসার ডিজিটাল খাতা তৈরি করুন"
    >
      <div className="flex gap-2 p-1.5 bg-surface-container rounded-full mb-8 w-fit mx-auto md:mx-0">
        <button 
          type="button"
          onClick={() => setTab("phone")}
          className={`px-6 py-2.5 rounded-full font-bold shadow-sm text-sm transition-colors ${
            tab === "phone" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          মোবাইল নম্বর
        </button>
        <button 
          type="button"
          onClick={() => setTab("email")}
          className={`px-6 py-2.5 rounded-full font-bold shadow-sm text-sm transition-colors ${
            tab === "email" ? "bg-surface-container-lowest text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          ইমেইল
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput 
          label="আপনার পূর্ণ নাম"
          type="text"
          placeholder="যেমন: রহিম আহমেদ"
          icon="badge"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        {tab === "phone" ? (
          <FormInput 
            label="মোবাইল নম্বর"
            type="tel"
            prefixText="+৮৮০"
            placeholder="০১XXXXXXXXX"
            icon="call"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        ) : (
          <>
            <FormInput 
              label="ইমেইল এড্রেস"
              type="email"
              placeholder="example@email.com"
              icon="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormInput 
               label="মোবাইল নম্বর"
               type="tel"
               placeholder="০১XXXXXXXXX"
               icon="call"
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
             />
          </>
        )}

        <FormInput 
          label="দোকানের নাম"
          type="text"
          placeholder="যেমন: রহিম জেনারেল স্টোর"
          icon="storefront"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />

        {tab === "email" && (
          <FormInput 
            label="পাসওয়ার্ড"
            type="password"
            placeholder="আপনার পাসওয়ার্ড দিন"
            icon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        <label className="flex items-start gap-4 p-4 rounded-[1rem] bg-surface-container-low cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input 
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer h-5 w-5 rounded border-none bg-surface-container-highest text-primary focus:ring-offset-0 focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer" 
            />
          </div>
          <span className="text-sm text-on-surface-variant leading-relaxed select-none">
            আমি <a className="text-secondary font-semibold hover:underline" href="#">শর্তাবলী</a> এবং <a className="text-secondary font-semibold hover:underline" href="#">গোপনীয়তা নীতি</a> মেনে নিচ্ছি।
          </span>
        </label>

        {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}

        <GradientButton type="submit" loading={isLoading}>
          <span>পরবর্তী ধাপ</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </GradientButton>
      </form>

      <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
        <p className="text-on-surface-variant">
          ইতিমধ্যেই অ্যাকাউন্ট আছে? <Link href="/login" className="text-primary font-bold hover:underline">লগইন করুন</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
