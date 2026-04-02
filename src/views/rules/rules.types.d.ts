interface IRuleItem {
  title?: string
  description?: string
  icon?: import('vue').Component | null
  children?: IRuleItem[]
}
