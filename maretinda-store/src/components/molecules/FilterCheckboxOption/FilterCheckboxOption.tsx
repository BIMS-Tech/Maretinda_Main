import { Checkbox } from '@/components/atoms';
import { cn } from '@/lib/utils';

export const FilterCheckboxOption = ({
	label,
	amount,
	checked = false,
	onCheck = () => null,
	disabled = false,
	value,
}: {
	label: string;
	amount?: number;
	checked?: boolean;
	onCheck?: (option: string) => void;
	disabled?: boolean;
	value?: string;
}) => {
	return (
		<label
			className={cn(
				"flex gap-[10px] items-center cursor-pointer",
				disabled && "!cursor-default",
			)}
			onClick={() => (disabled ? null : onCheck(value || label))}
		>
			<Checkbox checked={checked} disabled={disabled} filter />
			<p className={cn("label-md font-normal", disabled && "text-disabled")}>
				{label}{" "}
				{amount && <span className="label-sm !font-light">({amount})</span>}
			</p>
		</label>
	);
};
