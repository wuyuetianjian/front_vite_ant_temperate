import { useMemo } from 'react'
import { theme as antdTheme } from 'antd'
import type { ConfigProviderProps, ThemeConfig } from 'antd'
import {
  getDefaultThemeConfig,
  parseThemeConfig,
  resolveSystemTheme,
  type ThemeMode,
  type ThemePresetKey,
} from '../presets'
import useDefaultTheme from './default'
import useDarkTheme from './dark'
import useGlassTheme from './glass'
import useMuiTheme from './mui'
import useShadcnTheme from './shadcn'
import useCartoonTheme from './cartoon'
import useIllustrationTheme from './illustration'
import useBootstrapTheme from './bootstrap'
import useGeekTheme from './geek'

/** Every preset hook returns a full ConfigProviderProps (theme + component classNames). */
export type UseTheme = () => ConfigProviderProps

/**
 * Master theme hook.
 *
 * antd-style's `useStyles` are React hooks, so every preset hook MUST be called
 * unconditionally; we collect them all and pick the active one by key. On top of
 * the chosen preset we layer the resolved light/dark + compact algorithm and the
 * user's per-account token overrides (official values act as the defaults).
 */
export function useAntdThemeConfig(
  preset: ThemePresetKey,
  mode: ThemeMode,
  customConfig?: string,
): ConfigProviderProps {
  const all: Record<ThemePresetKey, ConfigProviderProps> = {
    default: useDefaultTheme(),
    dark: useDarkTheme(),
    glass: useGlassTheme(),
    mui: useMuiTheme(),
    shadcn: useShadcnTheme(),
    cartoon: useCartoonTheme(),
    illustration: useIllustrationTheme(),
    bootstrap: useBootstrapTheme(),
    geek: useGeekTheme(),
  }
  const base = all[preset] ?? all.default

  return useMemo(() => {
    const resolvedMode = mode === 'system' ? resolveSystemTheme() : mode
    const cfg = parseThemeConfig(customConfig, preset, mode)
    const defaults = getDefaultThemeConfig(preset, mode)
    const baseTheme: ThemeConfig = base.theme ?? {}

    // Compose algorithms: keep the preset's own, add dark when resolved dark and
    // the preset isn't already dark, add compact for compact density.
    const raw = baseTheme.algorithm
    const algos = Array.isArray(raw) ? [...raw] : raw ? [raw] : [antdTheme.defaultAlgorithm]
    const isDark = algos.includes(antdTheme.darkAlgorithm)
    if (resolvedMode === 'dark' && !isDark) algos.push(antdTheme.darkAlgorithm)
    if (cfg.density === 'compact' && !algos.includes(antdTheme.compactAlgorithm)) {
      algos.push(antdTheme.compactAlgorithm)
    }

    // Per-account overrides — only for fields the user actually changed away from
    // the preset default, so an untouched account keeps the pure official theme.
    const override: ThemeConfig['token'] = {}
    if (cfg.primaryColor !== defaults.primaryColor) {
      override.colorPrimary = cfg.primaryColor
      override.colorInfo = cfg.primaryColor
    }
    if (cfg.backgroundColor !== defaults.backgroundColor) override.colorBgLayout = cfg.backgroundColor
    if (cfg.surfaceColor !== defaults.surfaceColor) override.colorBgContainer = cfg.surfaceColor
    if (cfg.textColor !== defaults.textColor) override.colorText = cfg.textColor
    if (cfg.textSecondaryColor !== defaults.textSecondaryColor) {
      override.colorTextSecondary = cfg.textSecondaryColor
    }
    if (cfg.borderColor !== defaults.borderColor) override.colorBorder = cfg.borderColor
    if (cfg.borderRadius !== defaults.borderRadius) override.borderRadius = cfg.borderRadius

    return {
      ...base,
      theme: {
        ...baseTheme,
        cssVar: {},
        hashed: false,
        algorithm: algos,
        token: { ...baseTheme.token, ...override },
      },
    }
  }, [base, preset, mode, customConfig])
}
