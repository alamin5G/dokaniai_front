export type OnboardingSampleProduct = {
    name: string;
    price: string;
};

const DEFAULT_SAMPLE_PRODUCTS: OnboardingSampleProduct[] = [
    { name: "চাল", price: "80" },
    { name: "ডাল", price: "120" },
    { name: "তেল", price: "180" },
];

export const SAMPLE_PRODUCTS_BY_BUSINESS_TYPE: Readonly<Record<string, ReadonlyArray<OnboardingSampleProduct>>> = {
    GROCERY: DEFAULT_SAMPLE_PRODUCTS,
    FASHION: [
        { name: "টি-শার্ট", price: "450" },
        { name: "জিন্স প্যান্ট", price: "900" },
        { name: "থ্রি-পিস", price: "1600" },
    ],
    ELECTRONICS: [
        { name: "চার্জার", price: "350" },
        { name: "ইয়ারফোন", price: "500" },
        { name: "পাওয়ার ব্যাংক", price: "1500" },
    ],
    RESTAURANT: [
        { name: "খিচুড়ি", price: "120" },
        { name: "চিকেন কারি", price: "180" },
        { name: "চা", price: "20" },
    ],
    PHARMACY: [
        { name: "প্যারাসিটামল", price: "20" },
        { name: "অ্যান্টাসিড", price: "35" },
        { name: "স্যানিটাইজার", price: "90" },
    ],
    STATIONERY: [
        { name: "খাতা", price: "60" },
        { name: "বলপেন", price: "12" },
        { name: "পেন্সিল", price: "10" },
    ],
    HARDWARE: [
        { name: "হাতুড়ি", price: "350" },
        { name: "স্ক্রু ড্রাইভার", price: "180" },
        { name: "প্লায়ার্স", price: "280" },
    ],
    BAKERY: [
        { name: "ব্রেড", price: "55" },
        { name: "কেক স্লাইস", price: "80" },
        { name: "বিস্কুট", price: "30" },
    ],
    MOBILE_SHOP: [
        { name: "মোবাইল কভার", price: "250" },
        { name: "টেম্পার্ড গ্লাস", price: "180" },
        { name: "ইউএসবি কেবল", price: "220" },
    ],
    TAILORING: [
        { name: "শার্ট সেলাই", price: "450" },
        { name: "ব্লাউজ সেলাই", price: "350" },
        { name: "প্যান্ট অল্টার", price: "200" },
    ],
    SWEETS_SHOP: [
        { name: "রসগোল্লা", price: "25" },
        { name: "মিষ্টি দই", price: "120" },
        { name: "সন্দেশ", price: "30" },
    ],
    COSMETICS: [
        { name: "ফেসওয়াশ", price: "220" },
        { name: "লিপস্টিক", price: "350" },
        { name: "শ্যাম্পু", price: "280" },
    ],
    BOOKSHOP: [
        { name: "বাংলা উপন্যাস", price: "320" },
        { name: "পরীক্ষার গাইড", price: "450" },
        { name: "লেখার খাতা", price: "60" },
    ],
    JEWELLERY: [
        { name: "সোনার আংটি", price: "9500" },
        { name: "রুপার চেইন", price: "1800" },
        { name: "কানের দুল", price: "2800" },
    ],
    PRINTING: [
        { name: "A4 প্রিন্ট", price: "5" },
        { name: "কালার প্রিন্ট", price: "15" },
        { name: "ল্যামিনেশন", price: "25" },
    ],
    OTHER: [
        { name: "পণ্য ১", price: "100" },
        { name: "পণ্য ২", price: "150" },
        { name: "পণ্য ৩", price: "200" },
    ],
    RICE_SHOP: [
        { name: "মিনিকেট চাল", price: "85" },
        { name: "কালিজিরা চাল", price: "120" },
        { name: "পারবোলেড চাল", price: "65" },
    ],
    FERTILIZER_SEED: [
        { name: "ইউরিয়া সার", price: "450" },
        { name: "ডিএপি সার", price: "800" },
        { name: "ধানের বীজ", price: "300" },
    ],
    SHOE_STORE: [
        { name: "স্পোর্টস শু", price: "1200" },
        { name: "চপ্পল", price: "250" },
        { name: "লেদার শু", price: "2200" },
    ],
    COMPUTER_SHOP: [
        { name: "মাউস", price: "350" },
        { name: "কিবোর্ড", price: "800" },
        { name: "ওয়েবক্যাম", price: "1500" },
    ],
};

export function getSampleProductsByBusinessType(type?: string): OnboardingSampleProduct[] {
    const source = (type && SAMPLE_PRODUCTS_BY_BUSINESS_TYPE[type]) || DEFAULT_SAMPLE_PRODUCTS;
    return source.map((product) => ({ ...product }));
}
