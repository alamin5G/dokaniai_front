"use client";

import { useTranslations } from "next-intl";

export function TestimonialsSection() {
  const t = useTranslations("home.testimonials");

  return (
    /* Matches reference: bg-surface-container-high/30 */
    <section className="home-section bg-surface-container-high/30">
      <div className="home-container">
        <h3 className="text-3xl sm:text-4xl font-black text-primary text-center mb-12 md:mb-16 font-headline">{t("title")}</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Testimonial 1 — matches reference: rounded-3xl, border-t on author */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl space-y-4">
            <div className="flex text-secondary mb-4">
              {[1,2,3,4,5].map((_, i) => (
                <span key={i} className="material-symbols-outlined home-icon-fill">star</span>
              ))}
            </div>
            <p className="text-lg italic font-medium text-on-surface leading-relaxed">
              &ldquo;{t("t1.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  alt="Local store owner"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFpbZaGoDB26rUfT8dAX9Fumchby-B3zzJrPwWEo_gvmZs3FnQ2CxSvw1LQenQYUDjBc2LWhBS5K2sk3ImUJ-2MJMHsaZBs9W_4gYHM5Z2YW7Vc7ShmEdCpMrcHwBV0XSjkFiqisePaLozU8gSggc0MKUyErr7iKUfyFYnw3ZnlGa7M0dI7UZXSZz9MaGCvYJjoxfzdmMTYAEf47fUWZYRBpdbo9DCAnnZQR3mP-RwH0T5tOB2bB--Z2OynIk6kf27XQLtF-2I7jI"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-on-background">{t("t1.name")}</p>
                <p className="text-xs text-on-surface-variant">{t("t1.shop")}</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl space-y-4">
            <div className="flex text-secondary mb-4">
              {[1,2,3,4,5].map((_, i) => (
                <span key={i} className="material-symbols-outlined home-icon-fill">star</span>
              ))}
            </div>
            <p className="text-lg italic font-medium text-on-surface leading-relaxed">
              &ldquo;{t("t2.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  alt="Shop manager"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbQdCRjxmSmVGIsOCbBhsvyB3wzcWwBWiQIzp5ndidZFvs6cpmkGY7yhOfYsYw4A1s8O83NfvKE54hqWXw08o0DTzr0PZ9m1K6uzQSvc7X7MmIUvGD9l5yf7yAbVffe4wcSCzWS3zPicKBrhNE-ZKZm2JT-3VIz6_LF614O8mk1SNueHupa9bZClK2m3kcilhvWGRpbOlDdy30n8r2UXxtxcT0s3bJkcY7Rt5Kr7F4Kfa4g4HmxveJ-vc4JNNH6nxqyA2iOEBj-Fc"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-on-background">{t("t2.name")}</p>
                <p className="text-xs text-on-surface-variant">{t("t2.shop")}</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl space-y-4">
            <div className="flex text-secondary mb-4">
              {[1,2,3,4,5].map((_, i) => (
                <span key={i} className="material-symbols-outlined home-icon-fill">star</span>
              ))}
            </div>
            <p className="text-lg italic font-medium text-on-surface leading-relaxed">
              &ldquo;{t("t3.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  alt="Small business owner"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHGZbn26NYxMo0c16xCCjN3Plshh13tZU3JbiClBomK1s-P9CgC3oKYlNQ4-zOfksVqvJwZq98ouTXPrjnh6BmMv6q9vB8hLCeAAQBBx_pqGvFPBlONvmtmSVnvtGJqTDWtKvA_zNkVYEja1XaSl3OTty-tuC4Y2iUd__9tL7YIAx1Ytl0tTqEufODUGJ0h197g55lvNfPpbTLMo-JFS4wje1x6Y7YKsjLdf1Xc7hu3Feu9o5bVKgMEunuN76twy1L85gF2bjAdN8"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-on-background">{t("t3.name")}</p>
                <p className="text-xs text-on-surface-variant">{t("t3.shop")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
