/** Один варіант у групі перемикачів фільтра (`FilterChips`). */
export interface IFilterChipOption<T = string> {
  value: T
  label: string
  /** Phosphor-іконка ліворуч від підпису. */
  icon?: Component
  /** Картинка (наприклад, медаль рангу) замість іконки. */
  image?: string
  /** Другорядний підпис (моно) праворуч від основного. */
  hint?: string
}
