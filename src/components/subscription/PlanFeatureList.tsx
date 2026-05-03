import type { Plan } from "@/types/subscription";
import { getPlanFeatureItems } from "@/lib/planFeatureDisplay";

interface PlanFeatureListProps {
  plan: Plan;
  isBn: boolean;
  maxItems?: number;
  compact?: boolean;
  inverted?: boolean;
}

export function PlanFeatureList({ plan, isBn, maxItems, compact = false, inverted = false }: PlanFeatureListProps) {
  const items = getPlanFeatureItems(plan, isBn, maxItems);
  if (items.length === 0) return null;

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2 text-sm">
          <span
            className={`material-symbols-outlined mt-0.5 text-[18px] ${inverted ? "text-inverse-primary" : "text-primary"}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {item.type === "QUOTA" ? "speed" : item.type === "LIMIT" ? "tune" : "check_circle"}
          </span>
          <span className={inverted ? "text-white/85" : "text-on-surface-variant"}>
            {item.label}
            {item.value ? <span className="font-semibold">: {item.value}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
