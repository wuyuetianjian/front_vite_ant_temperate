import { useState } from 'react'
import { Button, Form, Input, Modal, QRCode, Space, Steps, Typography, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import { apiError } from '../api/client'
import type { Setup2FAReply } from '../types'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export default function Setup2FAModal({ open, onSuccess, onCancel }: Props) {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()
  const [step, setStep] = useState(0)
  const [setup, setSetup] = useState<Setup2FAReply | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<{ totp_code: string }>()

  const handleOpen = async () => {
    setStep(0)
    setSetup(null)
    form.resetFields()
    setLoading(true)
    try {
      const result = await authApi.setup2FA()
      setSetup(result)
      setStep(1)
    } catch (err) {
      messageApi.error(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async (values: { totp_code: string }) => {
    setLoading(true)
    try {
      await authApi.enable2FA(values.totp_code)
      messageApi.success(t('twoFactor.enableSuccess'))
      onSuccess()
    } catch (err) {
      messageApi.error(apiError(err) || t('twoFactor.loginError'))
    } finally {
      setLoading(false)
    }
  }

  const handleAfterOpen = (visible: boolean) => {
    if (visible) handleOpen()
  }

  return (
    <Modal
      title={t('twoFactor.setupTitle')}
      open={open}
      onCancel={onCancel}
      footer={null}
      afterOpenChange={handleAfterOpen}
      width={480}
    >
      {contextHolder}
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: t('twoFactor.setupTitle') },
          { title: t('twoFactor.verifyCode') },
        ]}
      />

      {step === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
        </div>
      )}

      {step === 1 && setup && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Paragraph type="secondary">
            {t('twoFactor.setupDesc')}
          </Typography.Paragraph>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <QRCode value={setup.qr_url} size={180} />
          </div>

          <div style={{ background: 'var(--glass-bg, rgba(0,0,0,0.04))', borderRadius: 8, padding: '8px 12px' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('twoFactor.secret')}</Typography.Text>
            <Typography.Paragraph code copyable style={{ margin: 0, wordBreak: 'break-all' }}>
              {setup.secret}
            </Typography.Paragraph>
          </div>

          <Form form={form} layout="vertical" onFinish={handleEnable}>
            <Form.Item
              name="totp_code"
              label={t('twoFactor.verifyCode')}
              extra={t('twoFactor.verifyCodeHint')}
              rules={[
                { required: true, message: t('twoFactor.error.code') },
                { len: 6, message: t('twoFactor.error.code') },
              ]}
            >
              <Input
                maxLength={6}
                placeholder={t('twoFactor.verifyCodePlaceholder')}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button onClick={onCancel}>{t('common.cancel')}</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {t('twoFactor.enable')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      )}
    </Modal>
  )
}
