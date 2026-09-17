import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  shortcuts: {
    'btn-primary': 'px-4 py-2 rounded bg-primary text-white hover:bg-opacity-90 transition cursor-pointer',
    'btn-secondary': 'px-4 py-2 rounded bg-secondary text-white hover:bg-opacity-90 transition cursor-pointer',
    'card': 'rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700',
  },
})
