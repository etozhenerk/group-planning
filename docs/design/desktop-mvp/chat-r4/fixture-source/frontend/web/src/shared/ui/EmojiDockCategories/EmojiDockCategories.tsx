import { categoryIcons } from '@/shared/ui/EmojiPicker/lib/categoryIcons';
import styles from '@/shared/ui/EmojiDockCategories/EmojiDockCategories.module.css';

export type EmojiDockCategoriesProps = {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
};

export const EmojiDockCategories = ({
  categories,
  selected,
  onSelect,
}: EmojiDockCategoriesProps) => (
  <div className={styles.categories} role="group" aria-label="Категории эмодзи">
    {categories.map((category, index) => (
      <button
        key={category}
        type="button"
        aria-label={category}
        title={category}
        aria-pressed={selected === category}
        onClick={() => onSelect(category)}
      >
        <span aria-hidden="true">{categoryIcons[index] ?? '⋯'}</span>
      </button>
    ))}
  </div>
);
