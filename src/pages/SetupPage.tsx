import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert, Button, Card, Divider, Form, Input, Space, Typography, message, Spin,
  theme as antdTheme,
} from 'antd'
import { LockOutlined, SafetyCertificateOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import { apiError } from '../api/client'
import { useAuthStore } from '../store/auth'
import config from '../config'

const { Title, Text, Paragraph } = Typography

interface SetupLocationState {
  initialPassword?: string
  username?: string
}

interface FormValues {
  old_password: string
  new_password: string
  confirm_password: string
}

export default function SetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { token } = antdTheme.useToken()

  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [initialPassword, setInitialPassword] = useState('')
  const [adminUsername, setAdminUsername] = useState('admin')

  const state = location.state as SetupLocationState | null

  useEffect(() => {
    // If we arrived from the login flow (must_change_password), use state directly
    if (state?.initialPassword) {
      setInitialPassword(state.initialPassword)
      if (state.username) setAdminUsername(state.username)
      form.setFieldValue('old_password', state.initialPassword)
      return
    }

    // Otherwise fetch from the API (arrived via App.tsx startup check or direct navigation)
    setFetching(true)
    authApi.getInitialPassword()
      .then((result) => {
        if (!result.available) {
          // Setup already done - go to login or admin
          navigate(isAuthenticated() ? '/admin' : '/login', { replace: true })
          return
        }
        setInitialPassword(result.initial_password)
        setAdminUsername(result.username || 'admin')
        form.setFieldValue('old_password', result.initial_password)
      })
      .catch(() => {
        navigate('/login', { replace: true })
      })
      .finally(() => setFetching(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    navigator.clipboard.writeText(initialPassword).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSubmit = async (values: FormValues) => {
    if (values.new_password !== values.confirm_password) {
      form.setFields([{ name: 'confirm_password', errors: [t('changePassword.mismatch')] }])
      return
    }
    setLoading(true)
    try {
      // If not yet authenticated, log in first with the initial credentials
      if (!isAuthenticated()) {
        const loginResult = await authApi.login(adminUsername, initialPassword)
        useAuthStore.getState().setAuth(loginResult.token, loginResult.user)
      }
      await authApi.changePassword(values.old_password, values.new_password)
      message.success(t('changePassword.success'))
      navigate('/admin', { replace: true })
    } catch (err) {
      message.error(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: token.colorBgLayout,
    }}>
      {/* Branding */}
      <Space align="center" style={{ marginBottom: 32 }}>
        <Text strong style={{ fontSize: 18 }}>{config.appName}</Text>
      </Space>

      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: token.boxShadowTertiary,
        }}
        styles={{ body: { padding: '32px 36px' } }}
      >
        {/* Header */}
        <Space direction="vertical" size={4} style={{ marginBottom: 24, width: '100%' }}>
          <Space align="center" size={10}>
            <SafetyCertificateOutlined style={{ fontSize: 22, color: token.colorWarning }} />
            <Title level={4} style={{ margin: 0 }}>{t('setup.title')}</Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>{t('setup.subtitle')}</Text>
        </Space>

        {/* Warning */}
        <Alert
          type="warning"
          showIcon
          message={t('setup.warningTitle')}
          description={t('setup.warningDesc')}
          style={{ marginBottom: 24, borderRadius: 8 }}
        />

        {/* Initial credentials block */}
        <div style={{
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 28,
        }}>
          <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.55 }}>
            {t('setup.initialCredentials')}
          </Text>

          <Space direction="vertical" size={10} style={{ marginTop: 12, width: '100%' }}>
            {/* Username */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13, minWidth: 80 }}>{t('users.username')}</Text>
              <Text
                code
                style={{ fontSize: 14, letterSpacing: '0.04em', background: 'transparent', border: 'none', padding: 0 }}
              >
                {adminUsername}
              </Text>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 13, minWidth: 80 }}>{t('login.password')}</Text>
              <Space size={6} style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Text
                  code
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    wordBreak: 'break-all',
                    textAlign: 'right',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  {initialPassword}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={copied ? <CheckOutlined style={{ color: token.colorSuccess }} /> : <CopyOutlined />}
                  onClick={handleCopy}
                  style={{ flexShrink: 0 }}
                />
              </Space>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '0 0 24px' }}>
          <LockOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{t('setup.changeNow')}</Text>
        </Divider>

        {/* Change password form */}
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label={t('changePassword.oldPassword')}
            name="old_password"
            rules={[{ required: true, message: t('changePassword.error.oldPassword') }]}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{t('setup.oldPasswordHint')}</Text>}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Form.Item
            label={t('changePassword.newPassword')}
            name="new_password"
            rules={[
              { required: true, message: t('changePassword.error.newPassword') },
              { min: 6, message: t('changePassword.error.newPasswordMin') },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder={t('setup.newPasswordPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('changePassword.confirmPassword')}
            name="confirm_password"
            rules={[{ required: true, message: t('changePassword.error.confirmPassword') }]}
            style={{ marginBottom: 28 }}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
            style={{ borderRadius: 10, height: 46, fontWeight: 650 }}
          >
            {t('setup.submit')}
          </Button>
        </Form>

        <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
          {t('setup.note')}
        </Paragraph>
      </Card>
    </div>
  )
}
