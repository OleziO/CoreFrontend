import twColors from 'tailwindcss/colors'

export const colors = {
  transparent: 'transparent',
  white: twColors.white,
  gray: twColors.gray,
  red: twColors.red,
  green: twColors.green,
  orange: twColors.orange,
  black: twColors.black,
  yellow: twColors.yellow,
  blue: twColors.blue,
  purple: twColors.purple,
  dark: {
    900: '#0A0711',
    800: '#1c1c1c',
    700: '#2c2c2c'
  },

  // todo: with the following code you can use element colors
  primary: 'var(--el-color-primary)',
  success: 'var(--el-color-success)',
  warning: 'var(--el-color-warning)',
  danger: 'var(--el-color-danger)',
  'bg-primary': '#0A0711'
}
