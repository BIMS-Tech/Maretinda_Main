/** Amounts are in pesos. Centavos only show when there are some. */
export function formatPrice(amount: number, currencyCode = 'PHP'): string {
  const value = Number(amount) || 0;
  const centavos = Number.isInteger(value) ? 0 : 2;
  const currency = currencyCode.toUpperCase();
  const number = value.toLocaleString('en-PH', { maximumFractionDigits: centavos, minimumFractionDigits: centavos });
  return currency === 'PHP' ? `₱${number}` : `${currency} ${number}`;
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function orderStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'fulfilled':
      return 'text-green-600';
    case 'pending':
    case 'processing':
      return 'text-yellow-600';
    case 'cancelled':
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
