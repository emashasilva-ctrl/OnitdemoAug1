import { CategoryIcon } from "@/components/category-icon";
import { gradientForSeed } from "@/lib/gradient";

export function VenueImage({
  seed,
  icon = "Sparkles",
  className,
}: {
  seed: string;
  icon?: string;
  className?: string;
}) {
  const { from, to, angle } = gradientForSeed(seed);

  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(${angle}deg, ${from}, ${to})`,
      }}
    >
      <div className="flex size-full items-center justify-center">
        <CategoryIcon
          name={icon}
          className="size-16 text-background/40 sm:size-20"
        />
      </div>
    </div>
  );
}
