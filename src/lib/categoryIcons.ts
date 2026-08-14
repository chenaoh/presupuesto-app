import {
  Briefcase,
  Percent,
  Laptop,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Clapperboard,
  Repeat,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  Tag,
  ShoppingCart,
  Coffee,
  Wifi,
  Gift,
  Plane,
  Baby,
  PawPrint,
  Shirt,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Iconos disponibles para categorías (nombre Lucide → componente). */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  Percent,
  Laptop,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Clapperboard,
  Repeat,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  Tag,
  ShoppingCart,
  Coffee,
  Wifi,
  Gift,
  Plane,
  Baby,
  PawPrint,
  Shirt,
  Wrench,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICON_MAP);

export function getCategoryIcon(name?: string | null): LucideIcon {
  if (!name) return Tag;
  return CATEGORY_ICON_MAP[name] ?? Tag;
}
