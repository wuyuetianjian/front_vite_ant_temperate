import { useEffect, useRef, useState } from 'react'
import {
  Button, Card, Form, InputNumber, Spin, Typography, message,
} from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { settingsApi } from '../../api/settings'
import { apiError } from '../../api/client'
import { useWallpaperStore } from '../../store/wallpaper'
import type { SystemSettings } from '../../types'

const MAX_BYTES = 4 * 1024 * 1024

export default function SettingsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<SystemSettings>()
  const [messageApi, contextHolder] = message.useMessage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { url: wallpaperUrl, setUrl, clear } = useWallpaperStore()

  useEffect(() => {
    setLoading(true)
    settingsApi.get()
      .then((data) => form.setFieldsValue(data))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (values: SystemSettings) => {
    setSubmitting(true)
    try {
      await settingsApi.update(values)
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
    <div style={{ maxWidth: 520 }}>
      {contextHolder}
      <Typography.Title level={4} style={{ marginBottom: 24, color: 'var(--glass-text-primary)' }}>
        {t('settings.title')}
      </Typography.Title>

      {/* Appearance card */}
      <Card title={t('settings.appearance')} style={{ marginBottom: 24 }}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          {t('settings.wallpaperDesc')}
        </Typography.Paragraph>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Preview thumbnail */}
          <div style={{
            width: 240, height: 135, flexShrink: 0,
            borderRadius: 'var(--glass-radius-sm)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
            background: wallpaperUrl
              ? `url("${wallpaperUrl}") center/cover no-repeat`
              : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.10))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!wallpaperUrl && (
              <Typography.Text style={{ fontSize: 12, color: 'var(--glass-text-secondary)' }}>
                {t('settings.wallpaper')}
              </Typography.Text>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('settings.wallpaperUpload')}
            </Button>
            {wallpaperUrl && (
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={clear}
              >
                {t('settings.wallpaperReset')}
              </Button>
            )}
            <Typography.Text style={{ fontSize: 12, color: 'var(--glass-text-secondary)' }}>
              {t('settings.wallpaperSizeHint')}
            </Typography.Text>
          </div>
        </div>
      </Card>

      {/* Log retention card */}
      <Spin spinning={loading}>
        <Card title={t('settings.retention')}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
            {t('settings.retentionDesc')}
          </Typography.Paragraph>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            >
              <InputNumber min={1} max={3650} addonAfter={t('settings.days')} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t('settings.save')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  )
}
