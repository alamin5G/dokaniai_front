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
    const hasValue = props.value !== undefined && props.value !== "";
    const isFloating = isFocused || hasValue;

    return (
      <div className="space-y-1">
        <div className="relative group">
          {/* Left icon */}
          {icon && !isPassword && (
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl transition-colors duration-300 pointer-events-none z-10 ${error ? "text-error/70" : isFocused ? "text-primary" : "text-on-surface-variant/40"
              }`}>
              {icon}
            </span>
          )}
          {isPassword && (
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl transition-colors duration-300 pointer-events-none z-10 ${error ? "text-error/70" : isFocused ? "text-primary" : "text-on-surface-variant/40"
              }`}>
              lock
            </span>
          )}

          {/* Prefix text */}
          {prefixText && (
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm pointer-events-none z-10">
              {prefixText}
            </span>
          )}

          {/* Input */}
          <input
            {...props}
            ref={ref}
            type={inputType}
            onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
            className={`w-full ${icon || isPassword ? "pl-12" : "pl-4"} ${prefixText ? "pl-[5.5rem]" : ""} ${isPassword ? "pr-12" : icon ? "pr-4" : "pr-4"} pt-6 pb-2 bg-surface-container-highest/60 backdrop-blur-sm border-2 rounded-2xl focus:outline-none text-base text-on-surface placeholder:text-transparent transition-all duration-300 ${error
                ? "border-error/40 focus:border-error/60 shadow-[0_0_0_4px_rgba(211,47,47,0.08)]"
                : isFocused
                  ? "border-primary/40 shadow-[0_0_0_4px_rgba(0,55,39,0.08)] bg-surface-container-highest/80"
                  : "border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-highest/70"
              } ${className}`}
          />

          {/* Floating label */}
          <label className={`absolute pointer-events-none transition-all duration-300 z-10 ${icon || isPassword ? "left-12" : "left-4"
            } ${isFloating
              ? "top-2 text-[11px] font-bold tracking-wide"
              : "top-1/2 -translate-y-1/2 text-sm font-medium"
            } ${error ? "text-error/70" : isFocused ? "text-primary" : "text-on-surface-variant/50"
            }`}>
            {label}
          </label>

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors duration-200 p-0.5 rounded-lg hover:bg-primary/5"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-xl" data-icon={showPassword ? "visibility_off" : "visibility"}>
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-error ml-3 font-medium animate-[slideUp_0.2s_ease-out] flex items-center gap-1">
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
      className={`group relative w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] hover:shadow-xl hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:brightness-100 disabled:active:scale-100 overflow-hidden ${className}`}
      style={{ background: "linear-gradient(135deg, #003727 0%, #00503a 50%, #00654a 100%)" }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      {/* Pulse glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at center, rgba(0,80,58,0.3) 0%, transparent 70%)" }} />
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            {t("pleaseWait")}
          </>
        ) : children}
      </span>
    </button>
  );
};