export function formatKWh(value: number): string {
  return value.toFixed(1) + ' kWh';
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
