/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// WebGPU 最小类型声明
declare global {
  interface GPUAdapter {
    readonly features: ReadonlySet<string>
    readonly limits: Record<string, number>
    readonly isFallbackAdapter: boolean
  }

  interface Navigator {
    readonly gpu?: {
      requestAdapter(options?: {
        powerPreference?: 'low-power' | 'high-performance'
      }): Promise<GPUAdapter | null>
    }
  }
}

export {}
