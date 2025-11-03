import { Checkbox } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { Check } from "@medusajs/icons";

function getRGB(color: string): [number, number, number] {
	const temp = document.createElement("div");
	temp.style.color = color;
	document.body.appendChild(temp);
	const rgb = getComputedStyle(temp).color.match(/\d+/g)?.map(Number) ?? [
		0, 0, 0,
	];
	document.body.removeChild(temp);
	return [rgb[0], rgb[1], rgb[2]];
}

function getContrastColor(color: string): "black" | "white" {
	const [r, g, b] = getRGB(color);
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 128 ? "black" : "white";
}

export const ColorCheckboxOption = ({
	checked = false,
	onCheck = () => null,
	disabled = false,
	color,
}: {
	checked?: boolean;
	onCheck?: (option: string) => void;
	disabled?: boolean;
	color: string;
}) => {
	return (
		<button
			type="button"
			className={cn(
				"relative flex gap-[10px] items-center justify-center cursor-pointer w-[37px] h-[37px]",
				"rounded-full",
				"border-gray-400 border-[1px]",
			)}
			style={{
				backgroundColor: color,
			}}
			onClick={() => (disabled ? null : onCheck(color))}
		>
			<Check
				color={getContrastColor(color)}
				width={15}
				height={15}
				className={cn(checked ? "block" : "hidden")}
			/>
		</button>
	);
};
