"use client";

import React, { useState, InputHTMLAttributes } from "react";
import { useTranslations } from "next-intl";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  prefixText?: string;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, prefixText, error, type, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="space-y-1.5">
        <label className={`block text-sm font-semibold ml-1 transition-colors duration-200 ${error ? "text-error" : isFocused ? "text-primary" : "text-on-surface-variant"}`}>
          {label}
        </label>
        <div className="relative group">
          {prefixText && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-base">
              {prefixText}
            </span>
          )}
          <div className={`relative rounded-2xl transition-all duration-300 ${error ? 'ring-2 ring-error/40' : isFocused ? 'ring-2 ring-primary/30 shadow-[0_0_0_4px_rgba(0,59,42,0.08)]' : 'hover:shadow-md'}`}>
            <input
              {...props}
              ref={ref}
              type={inputType}
              onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
              onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
              className={`w-full ${prefixText ? "pl-16" : "pl-5"} ${isPassword || icon ? "pr-12" : "pr-5"} py-4 bg-surface-container-highest/80 backdrop-blur-sm border border-outline-variant/30 rounded-2xl focus:outline-none focus:border-primary/50 text-base text-on-surface placeholder:text-outline-variant/60 transition-all duration-300 ${className}`}
            />
          </div>
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors duration-200 p-0.5"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl" data-icon={showPassword ? "visibility_off" : "visibility"}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
          {!isPassword && icon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-xl">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-error ml-1 font-medium animate-[slideUp_0.2s_ease-out] flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export const GradientButton = ({ loading, children, className = "", ...props }: GradientButtonProps) => {
  const t = useTranslations("common");

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`group relative w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] hover:shadow-xl hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:brightness-100 overflow-hidden ${className}`}
      style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 50%, #00654a 100%)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      <span className="relative z-10 flex items-center gap-2">
        {loading ? t("pleaseWait") : children}
      </span>
    </button>
  );
};