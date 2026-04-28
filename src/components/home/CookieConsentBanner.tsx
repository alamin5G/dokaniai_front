"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "dokaniai_cookie_consent";

export function CookieConsentBanner() {
    const t = useTranslations("home.cookies");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem(STORAGE_KEY);
            if (!consent) {
                setVisible(true);
            }
        } catch {
            setVisible(true);
        }
    }, []);

    function handleAccept() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, ts: Date.now() }));
        } catch {
            // ignore
        }
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 animate-slide-up">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-white/10"
                style={{ background: "linear-gradient(135deg, #003727 0%, #001a12 100%)" }}
            >
                <span className="material-symbols-outlined text-3xl text-primary-container shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    cookie
                </span>
                <p className="text-sm text-white/80 leading-relaxed flex-1 text-center sm:text-left">
                    {t("message")}{" "}
                    <Link href="/legal/cookies" className="underline text-primary-container hover:text-white transition-colors">
                        {t("learnMore")}
                    </Link>
                </p>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={handleAccept}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        {t("accept")}
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}