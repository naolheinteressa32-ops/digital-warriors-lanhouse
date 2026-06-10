import type { Promotion } from "@/hooks/usePromotions";

export interface AppliedPromotion {
  promotion: Promotion | null;
  percent: number;
  discount: number;
  finalValue: number;
}

export function pickBestActivePromotion(promotions: Promotion[], now: Date = new Date()): Promotion | null {
  const eligible = promotions.filter((p) => {
    if (!p.active) return false;
    if (p.valid_from && new Date(p.valid_from).getTime() > now.getTime()) return false;
    if (p.valid_until && new Date(p.valid_until).getTime() < now.getTime()) return false;
    return Number(p.percent_off) > 0;
  });
  if (eligible.length === 0) return null;
  return eligible.reduce((best, cur) => (Number(cur.percent_off) > Number(best.percent_off) ? cur : best));
}

export function computePromotion(value: number, promotions: Promotion[], now: Date = new Date()): AppliedPromotion {
  const promo = pickBestActivePromotion(promotions, now);
  if (!promo) return { promotion: null, percent: 0, discount: 0, finalValue: value };
  const percent = Math.max(0, Math.min(100, Number(promo.percent_off)));
  const discount = Math.round((value * percent) / 100 * 100) / 100;
  return { promotion: promo, percent, discount, finalValue: Math.max(0, value - discount) };
}
