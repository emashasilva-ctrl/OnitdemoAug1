import { CategoryIcon } from "@/components/category-icon";
import { gradientForSeed } from "@/lib/gradient";
import { cn } from "@/lib/utils";

export function VenueImage({
  seed,
  src,
  icon = "Sparkles",
  className,
}: {
  seed: string;
  src?: string | null;
  icon?: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- data URLs aren't optimizable by next/image
    return <img src={src} alt="" className={cn("object-cover", className)} />;
  }

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
