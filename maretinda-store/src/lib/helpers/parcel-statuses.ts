export const steps = ['Received', 'Preparing', 'Shipped', 'Delivered'];

export const parcelStatuses = (order: string) => {
	switch (order) {
		case 'not_fulfilled':
			return 0;
		case 'fulfilled':
		case 'partially_fulfilled':
			return 1;
		case 'shipped':
		case 'partially_shipped':
			return 2;
		case 'delivered':
		case 'partially_delivered':
			return 3;
		default:
			return 0;
	}
};
