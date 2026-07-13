import { Button, Card, ColorPicker, Divider, Input, Radio, Slider, Space, Tag, Typography, message } from 'antd'
import { CheckOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { useThemeStore, type ThemeMode, type ThemePresetKey } from '../store/theme'
import { getDefaultThemeConfig, parseThemeConfig, previewThemeColor, serializeThemeConfig, themePresets, type ThemeCustomConfig } from '../theme/presets'

interface ThemeColorControlProps {
  label: string
  value: string
  token: keyof ThemeCustomConfig
  onChange: (value: string) => void
}

const themeColorOptions = (token: keyof ThemeCustomConfig) =>
  token === 'backgroundColor' || token === 'surfaceColor'
    ? ['#ffffff', '#f8fafc', '#f5f5f5', '#f1f5f9', '#f8fafc', '#fff7ed', '#fdf4ff', '#0f172a', '#111827']
    : ['#ffffff', '#1677ff', '#1976d2', '#7c3aed', '#0ea5e9', '#16a34a', '#f97316', '#e11d48', '#18181b']

function ThemeColorControl({ label, value, token, onChange }: ThemeColorControlProps) {
  return (
    <div className="theme-token-color">
      <span>{label}</span>
      <span className="theme-token-color-input">
        <ColorPicker value={value} onChange={(_, hex) => previewThemeColor(token, hex)} onChangeComplete={(next) => onChange(next.toHexString())} />
        <Input value={value} maxLength={7} onChange={(event) => onChange(event.target.value)} />
      </span>
      <span className="theme-color-options" aria-label={`${label} options`}>
        {themeColorOptions(token).map((color) => <button key={color} type="button" aria-label={color} style={{ background: color }} onClick={() => onChange(color)} />)}
      </span>
    </div>
  )
}

export default function ThemePresetPanel() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()
  const { preset, mode, customConfig, setMode, setPreset, setCustomConfig } = useThemeStore()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const config = parseThemeConfig(customConfig, preset, mode)

  const updateConfig = (patch: Partial<ThemeCustomConfig>) => {
    setCustomConfig(serializeThemeConfig({ ...config, ...patch }))
  }

  const savePreset = async (nextPreset: ThemePresetKey) => {
    const selected = themePresets.find((item) => item.key === nextPreset)
    if (!selected) return
    const previous = { preset, mode, customConfig }
    setPreset(nextPreset, selected.mode, '{}')
    try {
      const updatedUser = await authApi.updateTheme({ theme_preset: nextPreset, theme_mode: selected.mode, theme_config: '{}' })
      updateUser(updatedUser)
      messageApi.success(t('theme.saved'))
    } catch {
      setPreset(previous.preset, previous.mode, previous.customConfig)
      messageApi.error(t('theme.saveFailed'))
    }
  }

  const saveCustomTheme = async () => {
    const value = serializeThemeConfig(config)
    try {
      const updatedUser = await authApi.updateTheme({ theme_preset: preset, theme_mode: mode, theme_config: value })
      updateUser(updatedUser)
      messageApi.success(t('theme.saved'))
    } catch {
      setPreset(
        (user?.theme_preset || preset) as ThemePresetKey,
        (user?.theme_mode || mode) as ThemeMode,
        user?.theme_config || '',
      )
      messageApi.error(t('theme.saveFailed'))
    }
  }

  const resetCustomTheme = async () => {
    const previousConfig = customConfig
    setCustomConfig('{}')
    try {
      const updatedUser = await authApi.updateTheme({ theme_preset: preset, theme_mode: mode, theme_config: '{}' })
      updateUser(updatedUser)
      messageApi.success(t('theme.saved'))
    } catch {
      setCustomConfig(previousConfig)
      messageApi.error(t('theme.saveFailed'))
    }
  }

  return (
    <Card bordered={false} className="theme-preset-panel" style={{ borderRadius: 12, gridColumn: '1 / -1' }}>
      {contextHolder}
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>{t('theme.appearance')}</Typography.Title>
          <Typography.Text type="secondary">{t('theme.appearanceHint')}</Typography.Text>
        </div>
        <Tag color="blue">{t(`theme.presets.${preset}`)}</Tag>
      </Space>

      <div className="theme-preset-grid">
        {themePresets.map((item) => {
          const active = item.key === preset
          const cfg = getDefaultThemeConfig(item.key, item.mode)
          return (
            <button
              key={item.key}
              type="button"
              className={`theme-preset-card${active ? ' is-active' : ''}`}
              onClick={() => savePreset(item.key)}
              style={{
                background: `linear-gradient(135deg, ${cfg.backgroundColor} 0%, ${cfg.surfaceColor} 72%)`,
                color: cfg.textColor,
                borderColor: active ? cfg.primaryColor : cfg.borderColor,
                borderRadius: cfg.borderRadius,
                boxShadow: active ? `0 8px 24px ${cfg.primaryColor}55` : undefined,
              }}
            >
              <span className="theme-preset-preview" aria-hidden="true" style={{ borderColor: cfg.borderColor }}><span style={{ background: item.preview[0] }} /><span style={{ background: item.preview[1] }} /><span style={{ background: item.preview[2] }} /></span>
              <span className="theme-preset-name" style={{ color: cfg.textColor }}>{t(`theme.presets.${item.key}`)}</span>
              <span className="theme-preset-meta" style={{ color: cfg.textSecondaryColor }}>{item.density === 'compact' ? t('theme.compact') : t('theme.comfortable')}</span>
              {active && <CheckOutlined className="theme-preset-check" style={{ color: cfg.primaryColor }} />}
            </button>
          )
        })}
      </div>

      <Divider />
      <div className="theme-token-heading">
        <div><Typography.Text strong>{t('theme.customize')}</Typography.Text><br /><Typography.Text type="secondary">{t('theme.customizeHint')}</Typography.Text></div>
        <Radio.Group value={mode} onChange={(event) => setMode(event.target.value)} size="small">
          <Radio.Button value="light">{t('theme.light')}</Radio.Button><Radio.Button value="dark">{t('theme.dark')}</Radio.Button><Radio.Button value="system">{t('theme.system')}</Radio.Button>
        </Radio.Group>
      </div>
      <div className="theme-token-grid">
        <ThemeColorControl token="primaryColor" label={t('theme.primaryColor')} value={config.primaryColor} onChange={(primaryColor) => updateConfig({ primaryColor })} />
        <ThemeColorControl token="backgroundColor" label={t('theme.backgroundColor')} value={config.backgroundColor} onChange={(backgroundColor) => updateConfig({ backgroundColor })} />
        <ThemeColorControl token="surfaceColor" label={t('theme.surfaceColor')} value={config.surfaceColor} onChange={(surfaceColor) => updateConfig({ surfaceColor })} />
        <ThemeColorControl token="textColor" label={t('theme.textColor')} value={config.textColor} onChange={(textColor) => updateConfig({ textColor })} />
        <ThemeColorControl token="textSecondaryColor" label={t('theme.textSecondaryColor')} value={config.textSecondaryColor} onChange={(textSecondaryColor) => updateConfig({ textSecondaryColor })} />
        <ThemeColorControl token="borderColor" label={t('theme.borderColor')} value={config.borderColor} onChange={(borderColor) => updateConfig({ borderColor })} />
        <label className="theme-token-slider"><span>{t('theme.radius')}</span><Slider min={0} max={32} value={config.borderRadius} onChange={(borderRadius) => updateConfig({ borderRadius: Number(borderRadius) })} /><strong>{config.borderRadius}px</strong></label>
        <label className="theme-token-density"><span>{t('theme.density')}</span><Radio.Group value={config.density} onChange={(event) => updateConfig({ density: event.target.value })} size="small"><Radio.Button value="compact">{t('theme.compact')}</Radio.Button><Radio.Button value="default">{t('theme.comfortable')}</Radio.Button></Radio.Group></label>
      </div>
      <Space style={{ marginTop: 16 }} wrap>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveCustomTheme}>{t('common.save')}</Button>
        <Button icon={<ReloadOutlined />} onClick={resetCustomTheme}>{t('theme.resetPreset')}</Button>
      </Space>

    </Card>
  )
}
