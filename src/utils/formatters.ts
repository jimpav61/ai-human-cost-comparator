export const formatCurrency = (value: number): string => {
  return '$' + value.toFixed(2);
};

export const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};
