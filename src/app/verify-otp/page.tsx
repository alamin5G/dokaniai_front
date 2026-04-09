"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormInput, GradientButton } from "@/components/ui/FormPrimitives";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get("contact") || "";
  const setTokens = useAuthStore((state) => state.setTokens);
  
  const [otp, setOtp] = useState("");
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
    // You can also hit your API resend endpoint here
    // e.g. await apiClient.post("/auth/resend/email-verification", { email: contact })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorText("অনুগ্রহ করে সঠিক OTP দিন");
      return;
    }
    
    setErrorText("");
    setIsLoading(true);

    try {
      // In AuthController.java, /auth/verify/phone requires phone, otp, deviceId etc
      const response = await apiClient.post("/auth/verify/phone", {
        phone: contact,
        otp,
        deviceId: "web-client",
        deviceName: "Web Browser",
        deviceType: "WEB",
        userAgent: navigator.userAgent
      });

      const data = response.data?.data;
      if (data) {
        setTokens(data.accessToken, data.refreshToken, data.userId, data.status);
        
        if (data.status === "PASSWORD_SETUP_REQUIRED") {
          router.push("/set-password");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      setErrorText(error.response?.data?.message || "OTP ভেরিফিকেশন ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-on-surface-variant font-medium">
          {contact} নম্বরে একটি OTP পাঠানো হয়েছে।
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

      {errorText && <p className="text-error text-sm font-semibold">{errorText}</p>}

      <GradientButton type="submit" loading={isLoading}>
        <span>ভেরিফাই করুন</span>
        <span className="material-symbols-outlined">check_circle</span>
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

export default function VerifyOtpPage() {
  return (
    <AuthLayout 
      heading="OTP ভেরিফিকেশন" 
      subheading="আপনার অ্যাকাউন্ট নিরাপদ রাখুন"
    >
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </AuthLayout>
  );
}
