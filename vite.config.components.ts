import { readdirSync } from 'fs'
import { join as pathJoin } from 'pathe'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { IconsResolverCustom } from './vite.config.icons'

/* CONFIGURATION FOR COMPONENTS AUTO-IMPORT */
export const ComponentsBuilder = () => Components({
  /* У межах src/ — генеровані `import()` не виходять за корінь `include` tsconfig (TS6059 / ESLint vue). */
  dts: './src/vite-components.d.ts',
  dirs: [
    './src/components',
    ...buildViewsComponents('./src/views'),
    ...buildViewsComponents('./src/features')
  ],
  resolvers: [
    ElementPlusResolver({ importStyle: false }),
    IconsResolverCustom()
  ]
})

function buildViewsComponents (rootDir: string) {
  const componentsDirs: string[] = []
  function getComponentsDirs (dirName: string) {
    try {
      const dirs = readdirSync(dirName, { withFileTypes: true }).filter(dirent => dirent.isDirectory())
      dirs.forEach((dir) => {
        const dirPath = pathJoin(dirName, dir.name)
        if (dirPath.includes('/components')) {
          componentsDirs.push(dirPath)
        }
        getComponentsDirs((dirPath))
      })
    } catch {
      console.warn(`No such file or directory, ${dirName}`)
    }
  }
  getComponentsDirs(rootDir)
  return componentsDirs
}
