import { useState } from 'react'
import { Button, Form, Input, Modal, Space, Typography, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import { apiError } from '../api/client'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export default function Disable2FAModal({ open, onSuccess, onCancel }: Props) {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<{ totp_code: string }>()

  const handleDisable = async (values: { totp_code: string }) => {
    setLoading(true)
    try {
      await authApi.disable2FA(values.totp_code)
      messageApi.success(t('twoFactor.disableSuccess'))
      form.resetFields()
      onSuccess()
    } catch (err) {
      messageApi.error(apiError(err) || t('twoFactor.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={t('twoFactor.disableTitle')}
      open={open}
      onCancel={onCancel}
      footer={null}
      afterOpenChange={(v) => { if (!v) form.resetFields() }}
    >
      {contextHolder}
      <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
        {t('twoFactor.disableDesc')}
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={handleDisable}>
        <Form.Item
          name="totp_code"
          label={t('twoFactor.verifyCode')}
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
            <Button danger type="primary" htmlType="submit" loading={loading}>
              {t('twoFactor.disable')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
