"use client";

import { buildShopPath, getStoredActiveBusinessId } from "@/lib/shopRouting";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LegacyDashboardCatchAllRedirectPage() {
    const router = useRouter();
    const params = useParams<{ rest?: string[] }>();
    const searchParams = useSearchParams();

    useEffect(() => {
        const activeBusinessId = getStoredActiveBusinessId();
        if (!activeBusinessId) {
            router.replace("/businesses");
            return;
        }

        const rest = Array.isArray(params.rest) ? params.rest.join("/") : "";
        const target = buildShopPath(activeBusinessId, rest ? `/${rest}` : "");
        const query = searchParams.toString();
        router.replace(query ? `${target}?${query}` : target);
    }, [params.rest, searchParams, router]);

    return null;
}
