"use client";

const DEVICE_ID_STORAGE_KEY = "dokaniai-device-id";
let inMemoryDeviceId: string | undefined;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

export type ClientDeviceContext = {
  deviceId: string;
  deviceName: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET";
  userAgent: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function fallbackUuid(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0];
    return (
      Number(char) ^
      (random & (15 >> (Number(char) / 4)))
    ).toString(16);
  });
}

export function getOrCreateClientDeviceId(): string | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  let existing: string | null = null;
  try {
    existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    existing = inMemoryDeviceId ?? null;
  }

  if (isUuid(existing)) {
    return existing;
  }

  const deviceId =
    typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackUuid();

  inMemoryDeviceId = deviceId;

  try {
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    // Storage can be blocked in private mode or by user policy.
  }

  return deviceId;
}

function getNavigatorUserAgent(): string {
  if (!isBrowser()) {
    return "";
  }

  return navigator.userAgent || "";
}

function detectDeviceType(userAgent: string): "DESKTOP" | "MOBILE" | "TABLET" {
  const ua = userAgent.toLowerCase();

  if (
    ua.includes("tablet") ||
    ua.includes("ipad") ||
    (ua.includes("android") && !ua.includes("mobile"))
  ) {
    return "TABLET";
  }

  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipod")
  ) {
    return "MOBILE";
  }

  return "DESKTOP";
}

function getPlatformLabel(): string {
  if (!isBrowser()) {
    return "Unknown Platform";
  }

  const userAgentData = (navigator as NavigatorWithUAData).userAgentData;
  if (userAgentData?.platform) {
    return userAgentData.platform;
  }

  return navigator.platform || "Unknown Platform";
}

function getBrowserLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("edg/")) {
    return "Edge";
  }
  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return "Chrome";
  }
  if (ua.includes("firefox/")) {
    return "Firefox";
  }
  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return "Safari";
  }

  return "Browser";
}

function buildDeviceName(userAgent: string): string {
  const browser = getBrowserLabel(userAgent);
  const platform = getPlatformLabel();
  return `${browser} on ${platform}`;
}

export function getClientDeviceContext(): ClientDeviceContext | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const deviceId = getOrCreateClientDeviceId();
  if (!deviceId) {
    return undefined;
  }

  const userAgent = getNavigatorUserAgent();

  return {
    deviceId,
    deviceName: buildDeviceName(userAgent),
    deviceType: detectDeviceType(userAgent),
    userAgent,
  };
}
