import Link from "next/link";

import { buildShopPath } from "@/lib/shopRouting";

interface ShopFeaturePageProps {
    businessId: string;
    title: string;
    description: string;
}

export default function ShopFeaturePage({
    businessId,
    title,
    description,
}: ShopFeaturePageProps) {
    return (
        <section className="mx-auto max-w-3xl rounded-2xl bg-surface-container-low p-6 md:p-8">
            <h1 className="text-2xl font-bold text-on-surface md:text-3xl">{title}</h1>
            <p className="mt-3 text-base text-on-surface-variant">{description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href={buildShopPath(businessId)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
                >
                    Back To Dashboard
                </Link>
                <Link
                    href={buildShopPath(businessId, "/settings")}
                    className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-highest"
                >
                    Open Business Settings
                </Link>
            </div>
        </section>
    );
}
