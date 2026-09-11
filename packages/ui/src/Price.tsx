import { formatMoney } from "@topla/utils";

export interface PriceProps {
  amount: number;
  oldAmount?: number;
  currency?: string;
}

/** Отображение цены с зачёркнутой старой ценой. Скидка не пересчитывается
 * здесь — backend всегда присылает готовые amount/oldAmount. */
export function Price({ amount, oldAmount, currency = "UZS" }: PriceProps) {
  return (
    <span className="topla-price">
      <span className="topla-price__current">{formatMoney(amount, currency)}</span>
      {oldAmount && oldAmount > amount ? (
        <span className="topla-price__old">{formatMoney(oldAmount, currency)}</span>
      ) : null}
    </span>
  );
}
