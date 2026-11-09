import locations from '@/data/ph-locations.json';

// src/data/ph-locations.json comes from the PSGC list (psgc.gitlab.io). Metro
// Manila has no province in PSGC, so its cities sit under "Metro Manila".
const citiesByProvince: Record<string, string[]> = locations;

export const phProvinces = Object.keys(citiesByProvince);

const fold = (text: string) =>
	text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim();

/** Saved addresses were free text, so "cebu" still finds Cebu's cities. */
export const phCitiesOf = (province?: string | null): string[] => {
	const wanted = fold(province ?? '');
	const match = phProvinces.find((name) => fold(name) === wanted);
	return match ? citiesByProvince[match] : [];
};

/** Search that ignores case and accents, so "las pinas" finds Las Piñas. */
export const matchesSearch = (option: string, query: string) =>
	fold(option).includes(fold(query));
