export interface ProductUnitOption {
    value: string;
    labelBn: string;
    labelEn: string;
}

export const PRODUCT_UNIT_OPTIONS: ProductUnitOption[] = [
    { value: "pcs", labelBn: "টি / পিস", labelEn: "Pieces" },
    { value: "piece", labelBn: "পিস", labelEn: "Piece" },
    { value: "kg", labelBn: "কেজি", labelEn: "Kilogram" },
    { value: "gram", labelBn: "গ্রাম", labelEn: "Gram" },
    { value: "liter", labelBn: "লিটার", labelEn: "Litre" },
    { value: "ml", labelBn: "মিলি", labelEn: "Millilitre" },
    { value: "meter", labelBn: "মিটার", labelEn: "Meter" },
    { value: "cm", labelBn: "সেন্টিমিটার", labelEn: "Centimetre" },
    { value: "feet", labelBn: "ফুট / ফিট", labelEn: "Feet" },
    { value: "inch", labelBn: "ইঞ্চি", labelEn: "Inch" },
    { value: "yard", labelBn: "গজ", labelEn: "Yard" },
    { value: "hath", labelBn: "হাত", labelEn: "Hath" },
    { value: "packet", labelBn: "প্যাকেট", labelEn: "Packet" },
    { value: "box", labelBn: "বক্স", labelEn: "Box" },
    { value: "carton", labelBn: "কার্টন", labelEn: "Carton" },
    { value: "bundle", labelBn: "বান্ডিল", labelEn: "Bundle" },
    { value: "bag", labelBn: "ব্যাগ", labelEn: "Bag" },
    { value: "bottle", labelBn: "বোতল", labelEn: "Bottle" },
    { value: "can", labelBn: "ক্যান", labelEn: "Can" },
    { value: "tin", labelBn: "টিন", labelEn: "Tin" },
    { value: "bucket", labelBn: "বালতি", labelEn: "Bucket" },
    { value: "drum", labelBn: "ড্রাম", labelEn: "Drum" },
    { value: "basket", labelBn: "ঝুরি", labelEn: "Basket" },
    { value: "dozen", labelBn: "ডজন", labelEn: "Dozen" },
    { value: "pair", labelBn: "জোড়া", labelEn: "Pair" },
    { value: "set", labelBn: "সেট", labelEn: "Set" },
    { value: "unit", labelBn: "ইউনিট", labelEn: "Unit" },
    { value: "maund", labelBn: "মণ", labelEn: "Maund" },
    { value: "seer", labelBn: "সের", labelEn: "Seer" },
    { value: "chitak", labelBn: "ছটাক", labelEn: "Chitak" },
    { value: "quintal", labelBn: "কুইন্টাল", labelEn: "Quintal" },
    { value: "ganda", labelBn: "গণ্ডা", labelEn: "Ganda" },
    { value: "hali", labelBn: "হালি", labelEn: "Hali" },
    { value: "bunch", labelBn: "মণ্ড / ছড়া", labelEn: "Bunch" },
    { value: "plate", labelBn: "প্লেট", labelEn: "Plate" },
    { value: "cup", labelBn: "কাপ", labelEn: "Cup" },
    { value: "glass", labelBn: "গ্লাস", labelEn: "Glass" },
    { value: "bowl", labelBn: "বাটি", labelEn: "Bowl" },
    { value: "serving", labelBn: "পরিবেশন", labelEn: "Serving" },
    { value: "portion", labelBn: "পোরশন", labelEn: "Portion" },
    { value: "slice", labelBn: "স্লাইস / টুকরা", labelEn: "Slice" },
    { value: "loaf", labelBn: "লোফ", labelEn: "Loaf" },
    { value: "tablet", labelBn: "ট্যাবলেট", labelEn: "Tablet" },
    { value: "capsule", labelBn: "ক্যাপসুল", labelEn: "Capsule" },
    { value: "strip", labelBn: "স্ট্রিপ", labelEn: "Strip" },
    { value: "vial", labelBn: "ভায়াল", labelEn: "Vial" },
    { value: "tube", labelBn: "টিউব", labelEn: "Tube" },
    { value: "syringe", labelBn: "সিরিঞ্জ", labelEn: "Syringe" },
    { value: "sachet", labelBn: "স্যাশে", labelEn: "Sachet" },
    { value: "dropper", labelBn: "ড্রপার", labelEn: "Dropper" },
    { value: "injection", labelBn: "ইনজেকশন", labelEn: "Injection" },
    { value: "notebook", labelBn: "খাতা", labelEn: "Notebook" },
    { value: "pen", labelBn: "কলম", labelEn: "Pen" },
    { value: "copy", labelBn: "কপি", labelEn: "Copy" },
    { value: "volume", labelBn: "ভলিউম", labelEn: "Volume" },
    { value: "page", labelBn: "পৃষ্ঠা", labelEn: "Page" },
    { value: "ream", labelBn: "রিম", labelEn: "Ream" },
    { value: "booklet", labelBn: "বুকলেট", labelEn: "Booklet" },
    { value: "poster", labelBn: "পোস্টার", labelEn: "Poster" },
    { value: "banner", labelBn: "ব্যানার", labelEn: "Banner" },
    { value: "roll", labelBn: "রোল", labelEn: "Roll" },
    { value: "sheet", labelBn: "শিট", labelEn: "Sheet" },
    { value: "bolt", labelBn: "থান", labelEn: "Bolt" },
    { value: "thread", labelBn: "সুতা", labelEn: "Thread" },
    { value: "battery", labelBn: "ব্যাটারি", labelEn: "Battery" },
    { value: "earphone", labelBn: "ইয়ারফোন", labelEn: "Earphone" },
    { value: "headphone", labelBn: "হেডফোন", labelEn: "Headphone" },
    { value: "charger", labelBn: "চার্জার", labelEn: "Charger" },
    { value: "cable", labelBn: "ক্যাবল", labelEn: "Cable" },
    { value: "case", labelBn: "কেস", labelEn: "Case" },
    { value: "screen", labelBn: "স্ক্রিন", labelEn: "Screen" },
    { value: "pin", labelBn: "পিন", labelEn: "Pin" },
    { value: "pouch", labelBn: "পাউচ", labelEn: "Pouch" },
    { value: "bhori", labelBn: "ভরি", labelEn: "Bhori" },
    { value: "ana", labelBn: "আণা", labelEn: "Ana" },
    { value: "tola", labelBn: "তোলা", labelEn: "Tola" },
    { value: "ratti", labelBn: "রতি", labelEn: "Ratti" },
    { value: "masha", labelBn: "মশা", labelEn: "Masha" },
    { value: "carat", labelBn: "ক্যারেট", labelEn: "Carat" },
    { value: "chain", labelBn: "চেইন", labelEn: "Chain" },
    { value: "bead", labelBn: "দানা", labelEn: "Bead" },
    { value: "sponge", labelBn: "স্পঞ্জ", labelEn: "Sponge" },
    { value: "brush", labelBn: "ব্রাশ", labelEn: "Brush" },
    { value: "stick", labelBn: "স্টিক", labelEn: "Stick" },
];

export function getProductUnitOptions(currentValue?: string | null): ProductUnitOption[] {
    if (!currentValue || PRODUCT_UNIT_OPTIONS.some((unit) => unit.value === currentValue)) {
        return PRODUCT_UNIT_OPTIONS;
    }

    return [
        { value: currentValue, labelBn: currentValue, labelEn: currentValue },
        ...PRODUCT_UNIT_OPTIONS,
    ];
}

export function getProductUnitLabel(unit: string, locale: string): string {
    const option = PRODUCT_UNIT_OPTIONS.find((item) => item.value === unit);
    if (!option) {
        return unit;
    }
    return locale.toLowerCase().startsWith("bn") ? option.labelBn : option.labelEn;
}

// ── Smart Quantity Input: Unit-aware step sizes ──────────────────────

/** Step size for −/+ buttons, keyed by unit value. */
export const UNIT_STEP_MAP: Record<string, number> = {
    // Weight (metric) — step 0.25
    kg: 0.25,
    gram: 1,
    // Weight (South Asian) — step 0.25
    maund: 0.25,
    seer: 0.25,
    chitak: 0.25,
    quintal: 0.25,
    // Volume — step 0.25
    liter: 0.25,
    ml: 1,
    // Precious metals — step 0.5
    bhori: 0.5,
    tola: 0.5,
    ana: 0.5,
    masha: 0.5,
    ratti: 0.5,
    carat: 0.5,
    // Length — step 0.25
    meter: 0.25,
    feet: 0.25,
    inch: 0.5,
    yard: 0.25,
    hath: 0.25,
};

/** Units that show quick-fraction chips (¼ ½ ¾ ১). */
export const FRACTIONAL_UNITS = new Set([
    "kg", "liter", "maund", "seer", "chitak", "quintal",
    "bhori", "tola", "ana", "masha", "ratti", "carat",
    "meter", "feet", "yard", "hath",
]);

/** Get step size for a given unit (default = 1). */
export function getUnitStep(unit: string): number {
    return UNIT_STEP_MAP[unit] ?? 1;
}

/** Check if a unit should show quick-fraction chips. */
export function isFractionalUnit(unit: string): boolean {
    return FRACTIONAL_UNITS.has(unit);
}
