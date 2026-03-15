import { every, isArray, isNull, isString } from "lodash";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const useUpdateSearchParams = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const updateSearchParams = (
		field: string | string[],
		value: string | string[] | null,
	) => {
		const updatedSearchParams = new URLSearchParams(searchParams.toString());

		if (
			isArray(value) &&
			every(value, (v) => isString(v) || isNull(v)) &&
			isArray(field) &&
			every(field, (v) => isString(v) || isNull(v)) &&
			field.length === value.length
		) {
			field.forEach((element, index) => {
				const fieldVal = value[index];
				if (!fieldVal) {
					updatedSearchParams.delete(element);
				} else {
					updatedSearchParams.set(element, fieldVal);
				}
			});
		} else if (isString(field) && (isString(value) || isNull(value))) {
			if (!value) {
				updatedSearchParams.delete(field);
			} else {
				updatedSearchParams.set(field, value);
			}
		}

		router.push(`${pathname}?${updatedSearchParams}`, {
			scroll: false,
		});
	};

	return updateSearchParams;
};

export default useUpdateSearchParams;
