/**
 * Indian Rupee (INR) Currency Formatter Utility
 * Formats numbers into standard Indian numbering format (e.g. ₹1,499, ₹1,25,000)
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const numericAmount = Math.round(Number(amount));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numericAmount);
}

export default formatINR;
