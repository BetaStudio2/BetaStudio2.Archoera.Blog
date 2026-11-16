/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  interface Window {
    SPELL_DICT: Record<string, number>
    SPELL_DICT_ZH: Record<string, number>
  }
}

export {}
