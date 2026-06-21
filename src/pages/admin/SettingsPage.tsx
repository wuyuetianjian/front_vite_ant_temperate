import { useEffect, useRef, useState } from 'react'
import {
  Button, Card, Form, Input, InputNumber, Spin, Switch, Typography, message,
} from 'antd'
import { AppstoreOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { settingsApi } from '../../api/settings'
import { apiError } from '../../api/client'
import { useWallpaperStore } from '../../store/wallpaper'
import { isCustomIcon, useSystemSettingsStore } from '../../store/systemSettings'
import type { SystemSettings } from '../../types'

const MAX_BYTES = 4 * 1024 * 1024

function IconPreview({ value }: { value?: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      border: '1px solid var(--glass-border)',
      background: isCustomIcon(value) ? 'rgba(255,255,255,0.72)' : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
    }}>
      {isCustomIcon(value) ? (
        <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <AppstoreOutlined style={{ color: '#fff', fontSize: 18 }} />
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<SystemSettings>()
  const [messageApi, contextHolder] = message.useMessage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { url: wallpaperUrl, setUrl, clear } = useWallpaperStore()
  const setSystemSettings = useSystemSettingsStore((s) => s.setSettings)
  const loadSystemSettings = useSystemSettingsStore((s) => s.load)
  const siteIcon = Form.useWatch('site_icon', form)
  const cornerIcon = Form.useWatch('corner_icon', form)

  useEffect(() => {
    setLoading(true)
    loadSystemSettings()
      .then((data) => form.setFieldsValue(data))
      .finally(() => setLoading(false))
  }, [form, loadSystemSettings])

  const handleSubmit = async (values: SystemSettings) => {
    setSubmitting(true)
    try {
      const updated = await settingsApi.update(values)
      setSystemSettings(updated)
      form.setFieldsValue(updated)
      messageApi.success(t('common.success'))
    } catch (err) {
      messageApi.error(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      messageApi.error(t('settings.wallpaperSizeError'))
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') setUrl(result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div>
      {contextHolder}
      <Typography.Title level={4} style={{ marginBottom: 24, color: 'var(--glass-text-primary)' }}>
        {t('settings.title')}
      </Typography.Title>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 440px), 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}>
            {/* 外观设置 — 内容较多，始终撑满整行 */}
            <Card title={t('settings.appearance')} style={{ gridColumn: '1 / -1' }}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
                {t('settings.brandDesc')}
              </Typography.Paragraph>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '0 32px',
              }}>
                <Form.Item
                  label={t('settings.serviceName')}
                  name="service_name"
                  rules={[{ required: true, message: t('settings.serviceNameRequired') }]}
                >
                  <Input maxLength={64} placeholder="Temperate" />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
                  <IconPreview value={siteIcon} />
                  <Form.Item label={t('settings.siteIcon')} name="site_icon" extra={t('settings.iconHint')}>
                    <Input placeholder="Temperate" />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
                  <IconPreview value={cornerIcon} />
                  <Form.Item label={t('settings.cornerIcon')} name="corner_icon" extra={t('settings.iconHint')}>
                    <Input placeholder="Temperate" />
                  </Form.Item>
                </div>
              </div>

              <Typography.Paragraph type="secondary" style={{ margin: '8px 0 20px' }}>
                {t('settings.wallpaperDesc')}
              </Typography.Paragraph>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 240, height: 135, flexShrink: 0,
                  borderRadius: 'var(--glass-radius-sm)',
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden',
                  background: wallpaperUrl
                    ? `url("${wallpaperUrl}") center/cover no-repeat`
                    : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(96,165,250,0.10))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!wallpaperUrl && (
                    <Typography.Text style={{ fontSize: 12, color: 'var(--glass-text-secondary)' }}>
                      {t('settings.wallpaper')}
                    </Typography.Text>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                    {t('settings.wallpaperUpload')}
                  </Button>
                  {wallpaperUrl && (
                    <Button icon={<DeleteOutlined />} danger onClick={clear}>
                      {t('settings.wallpaperReset')}
                    </Button>
                  )}
                  <Typography.Text style={{ fontSize: 12, color: 'var(--glass-text-secondary)' }}>
                    {t('settings.wallpaperSizeHint')}
                  </Typography.Text>
                </div>
              </div>
            </Card>

            {/* 双因素认证 */}
            <Card title={t('twoFactor.title')} style={{ height: '100%' }}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
                {t('twoFactor.systemSwitchDesc')}
              </Typography.Paragraph>
              <Form.Item
                label={t('twoFactor.systemSwitch')}
                name="totp_enabled"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>
            </Card>

            {/* 日志保留 */}
            <Card title={t('settings.retention')} style={{ height: '100%' }}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
                {t('settings.retentionDesc')}
              </Typography.Paragraph>

              <Form.Item
                label={t('settings.auditLogRetentionDays')}
                name="audit_log_retention_days"
                rules={[{ required: true, type: 'number', min: 1, max: 3650 }]}
              >
                <InputNumber min={1} max={3650} addonAfter={t('settings.days')} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label={t('settings.sessionLogRetentionDays')}
                name="session_log_retention_days"
                rules={[{ required: true, type: 'number', min: 1, max: 3650 }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={1} max={3650} addonAfter={t('settings.days')} style={{ width: '100%' }} />
              </Form.Item>
            </Card>

            {/* 保存按钮 — 始终占满整行 */}
            <Form.Item style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t('settings.save')}
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Spin>
    </div>
  )
}
