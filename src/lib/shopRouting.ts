const BUSINESS_STORAGE_KEY = "dokaniai-business-storage";

function normalizeSection(section: string): string {
    if (!section) return "";
    return section.startsWith("/") ? section : `/${section}`;
}

export function buildShopPath(businessId: string, section = ""): string {
    return `/shop/${businessId}${normalizeSection(section)}`;
}

export function getStoredActiveBusinessId(): string | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(BUSINESS_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as {
            state?: { activeBusinessId?: string | null };
        };

        const value = parsed?.state?.activeBusinessId;
        return typeof value === "string" && value.length > 0 ? value : null;
    } catch {
        return null;
    }
}

export function getPreferredWorkspacePath(): string {
    const activeBusinessId = getStoredActiveBusinessId();
    return activeBusinessId ? buildShopPath(activeBusinessId) : "/businesses";
}

export function getShopSectionFromPath(pathname: string): string {
    const match = pathname.match(/^\/shop\/[^/]+(\/.*)?$/);
    return match?.[1] ?? "";
}

export function replaceShopBusinessInPath(pathname: string, nextBusinessId: string): string {
    const section = getShopSectionFromPath(pathname);
    return buildShopPath(nextBusinessId, section);
}