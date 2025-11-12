
type OrderStatus = 'received' | 'pending' | 'delivered';

export const getStatusBadgeColors = (status: OrderStatus | string) => {
    const normalizedStatus = (status as string).toLowerCase().trim();

    switch (normalizedStatus) {
        case 'pending':
            return 'bg-[#FFEDD5]  border-[#FDBA74] text-[#9A3412]';

        case 'received':
            return 'bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]';
        default:
            return 'bg-gray-300 border-gray-700 text-gray-800';
    }
}
