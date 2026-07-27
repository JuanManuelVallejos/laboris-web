import Icon from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/sprite";

interface CategoryTileProps {
  icon: IconName;
  label: string;
  active?: boolean;
  urgent?: boolean;
  onClick?: () => void;
}

export function CategoryTile({ icon, label, active, urgent, onClick }: CategoryTileProps) {
  return (
    <button type="button" className="cat-tile" onClick={onClick} aria-pressed={active}>
      <span className={["cat-icon", urgent && "cat-icon--urgent", active && "cat-icon--active"].filter(Boolean).join(" ")}>
        <Icon name={icon} className="ico" />
      </span>
      <span className="cat-label">{label}</span>
    </button>
  );
}

export interface CategoryItem {
  icon: IconName;
  label: string;
  value: string;
  urgent?: boolean;
}

interface CategoryGridProps {
  items: CategoryItem[];
  activeValue?: string | null;
  onSelect?: (value: string) => void;
  className?: string;
}

export default function CategoryGrid({ items, activeValue, onSelect, className }: CategoryGridProps) {
  return (
    <div className={["grid grid-cols-4 md:grid-cols-7 lg:grid-cols-8 gap-3", className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <CategoryTile
          key={item.value}
          icon={item.icon}
          label={item.label}
          urgent={item.urgent}
          active={activeValue === item.value}
          onClick={() => onSelect?.(item.value)}
        />
      ))}
    </div>
  );
}
