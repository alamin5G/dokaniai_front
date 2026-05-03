import SubscriptionControlCenter from "@/components/account/SubscriptionControlCenter";
import { Suspense } from "react";

export default function AccountSubscriptionPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border border-outline-variant/30 bg-surface p-6 text-sm text-on-surface-variant">সাবস্ক্রিপশন তথ্য লোড হচ্ছে...</div>}>
      <SubscriptionControlCenter />
    </Suspense>
  );
}
