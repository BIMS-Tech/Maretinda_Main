export function formatPrice(amount: number, currencyCode = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
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
