const BENGALI_DIGIT_START = 0x09e6;
const ARABIC_INDIC_DIGIT_START = 0x0660;

function resolveNumberLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

export function normalizeLocalizedDigits(input: string): string {
    return input
        .replace(/[\u09E6-\u09EF]/g, (ch) => String(ch.charCodeAt(0) - BENGALI_DIGIT_START))
        .replace(/[\u0660-\u0669]/g, (ch) => String(ch.charCodeAt(0) - ARABIC_INDIC_DIGIT_START));
}

export function sanitizeNumericInput(
    input: string,
    options: {
        allowDecimal?: boolean;
        allowNegative?: boolean;
        maxIntegerDigits?: number;
        maxFractionDigits?: number;
    } = {},
): string {
    const {
        allowDecimal = false,
        allowNegative = false,
        maxIntegerDigits,
        maxFractionDigits,
    } = options;

    let value = normalizeLocalizedDigits(input).replace(/[^0-9.\-]/g, "");

    if (!allowNegative) {
        value = value.replace(/-/g, "");
    } else {
        value = value.startsWith("-") ? `-${value.slice(1).replace(/-/g, "")}` : value.replace(/-/g, "");
    }

    if (!allowDecimal) {
        value = value.replace(/\./g, "");
    } else {
        const firstDot = value.indexOf(".");
        if (firstDot !== -1) {
            value = `${value.slice(0, firstDot + 1)}${value.slice(firstDot + 1).replace(/\./g, "")}`;
        }
    }

    const sign = value.startsWith("-") ? "-" : "";
    const unsigned = sign ? value.slice(1) : value;
    const [integerPartRaw, fractionPartRaw = ""] = unsigned.split(".");

    const integerPart = maxIntegerDigits ? integerPartRaw.slice(0, maxIntegerDigits) : integerPartRaw;
    const fractionPart = maxFractionDigits != null ? fractionPartRaw.slice(0, maxFractionDigits) : fractionPartRaw;

    if (!allowDecimal) {
        return `${sign}${integerPart}`;
    }

    if (unsigned.includes(".")) {
        return `${sign}${integerPart}.${fractionPart}`;
    }

    return `${sign}${integerPart}`;
}

export function formatLocalizedNumber(
    value: number | string | null | undefined,
    locale?: string,
    options?: Intl.NumberFormatOptions,
): string {
    if (value == null || value === "") {
        return new Intl.NumberFormat(resolveNumberLocale(locale), options).format(0);
    }

    if (typeof value === "number") {
        return new Intl.NumberFormat(resolveNumberLocale(locale), options).format(value);
    }

    const normalized = normalizeLocalizedDigits(value).replace(/,/g, "").trim();
    const parsed = Number(normalized);

    if (Number.isNaN(parsed)) {
        return value;
    }

    return new Intl.NumberFormat(resolveNumberLocale(locale), options).format(parsed);
}

export function formatCurrencyBDT(
    value: number | string | null | undefined,
    locale?: string,
    options?: Intl.NumberFormatOptions,
): string {
    const formatted = formatLocalizedNumber(value, locale, options);
    return `৳${formatted}`;
}
