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
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-bold text-primary ml-1">{label}</label>
        <div className="relative group">
          {prefixText && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">
              {prefixText}
            </span>
          )}
          <input
            {...props}
            ref={ref}
            type={inputType}
            className={`w-full ${prefixText ? "pl-16" : "pl-6"} ${isPassword || icon ? "pr-12" : "pr-6"} py-4 bg-surface-container-highest border-none rounded-[1rem] focus:ring-2 focus:ring-primary-fixed-dim text-lg text-on-surface transition-all placeholder:text-outline-variant ${className}`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl" data-icon={showPassword ? "visibility_off" : "visibility"}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
          {!isPassword && icon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant">
              {icon}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-error ml-1 font-semibold">{error}</p>}
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
      className={`w-full py-4 rounded-[1rem] font-bold text-white shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 ${className}`}
      style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 100%)" }}
    >
      {loading ? t("pleaseWait") : children}
    </button>
  );
};
