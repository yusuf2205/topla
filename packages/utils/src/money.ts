/**
 * Форматирование денежных сумм для отображения. Это НЕ место для расчётов
 * цены/скидки/комиссии — все такие расчёты выполняются исключительно на
 * backend (см. docs/architecture.md §6, ТЗ §25).
 */
export function formatMoney(amount: number | string, currency = "UZS", locale = "ru-RU"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
