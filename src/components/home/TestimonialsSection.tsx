"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function TestimonialsSection() {
  const t = useTranslations("home.testimonials");

  const testimonials = [
    {
      quoteKey: "t1.quote",
      nameKey: "t1.name",
      shopKey: "t1.shop",
      image: "/icons/image/small-business-owner.jpg",
      alt: "Local store owner",
    },
    {
      quoteKey: "t2.quote",
      nameKey: "t2.name",
      shopKey: "t2.shop",
      image: "/icons/image/smiling.jpg",
      alt: "Shop manager",
    },
    {
      quoteKey: "t3.quote",
      nameKey: "t3.name",
      shopKey: "t3.shop",
      image: "/icons/image/shop-manager.jpg",
      alt: "Small business owner",
    },
  ];

  return (
    <section className="home-section bg-surface-container-high/30">
      <div className="home-container">
        <h3 className="text-3xl sm:text-4xl font-black text-primary text-center mb-12 md:mb-16 font-headline">{t("title")}</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="group bg-surface-container-lowest p-8 rounded-3xl space-y-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_-20px_rgba(0,80,58,0.2)] border border-transparent hover:border-primary/10"
            >
              <div className="flex text-secondary mb-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <span key={i} className="material-symbols-outlined home-icon-fill text-lg">star</span>
                ))}
              </div>
              <p className="text-lg italic font-medium text-on-surface leading-relaxed">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
                  <Image
                    alt={item.alt}
                    src={item.image}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-background">{t(item.nameKey)}</p>
                  <p className="text-xs text-on-surface-variant">{t(item.shopKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}