/** Deleting an account is permanent, so the buyer types DELETE to confirm. */
export const isDeletionConfirmed = (input: string) =>
	input.trim().toUpperCase() === 'DELETE';
