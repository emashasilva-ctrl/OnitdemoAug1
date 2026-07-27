import {
  Scissors,
  Sparkles,
  Sun,
  Flower2,
  Gem,
  UserRound,
  Eye,
  Wind,
  Soup,
  Flame,
  Fish,
  Pizza,
  UtensilsCrossed,
  Coffee,
  Beef,
  Croissant,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Scissors,
  Sparkles,
  Sun,
  Flower2,
  Gem,
  UserRound,
  Eye,
  Wind,
  Soup,
  Flame,
  Fish,
  Pizza,
  UtensilsCrossed,
  Coffee,
  Beef,
  Croissant,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
