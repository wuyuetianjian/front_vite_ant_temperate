import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WallpaperStore {
  url: string | null
  setUrl: (url: string) => void
  clear: () => void
}

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
    (set) => ({
      url: null,
      setUrl: (url) => set({ url }),
      clear: () => set({ url: null }),
    }),
    { name: 'wallpaper' },
  ),
)
