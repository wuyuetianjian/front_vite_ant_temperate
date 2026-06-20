import { Alert, Form, Input, Modal, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth'
import { apiError } from '../api/client'

interface Props {
  open: boolean
  /** Force the user to change — no cancel button, no close */
  mustChange?: boolean
  /** Plaintext initial password returned by the login API (only on first admin login).
   *  Pre-fills old_password so the user does not have to type it a second time. */
  initialPassword?: string
  onSuccess: () => void
  onCancel?: () => void
}

interface FormValues {
  old_password: string
  new_password: string
  confirm_password: string
}

export default function ChangePasswordModal({ open, mustChange, initialPassword, onSuccess, onCancel }: Props) {
  const { t } = useTranslation()
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)

  // When the modal opens with an initial password, pre-fill old_password so
  // the user does not have to type the system-generated password a second time.
  useEffect(() => {
    if (open && initialPassword) {
      form.setFieldValue('old_password', initialPassword)
    }
    if (!open) {
      form.resetFields()
    }
  }, [open, initialPassword, form])

  const handleSubmit = async (values: FormValues) => {
    if (values.new_password !== values.confirm_password) {
      form.setFields([{ name: 'confirm_password', errors: [t('changePassword.mismatch')] }])
      return
    }
    setLoading(true)
    try {
      await authApi.changePassword(values.old_password, values.new_password)
      message.success(t('changePassword.success'))
      form.resetFields()
      onSuccess()
    } catch (err) {
      message.error(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={t('changePassword.title')}
      open={open}
      onOk={() => form.submit()}
      onCancel={mustChange ? undefined : onCancel}
      closable={!mustChange}
      maskClosable={!mustChange}
      confirmLoading={loading}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      cancelButtonProps={mustChange ? { style: { display: 'none' } } : undefined}
      destroyOnClose={false}
    >
      {mustChange && (
        <Alert
          type="warning"
          message={t('changePassword.mustChange')}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}
      {initialPassword && (
        <Alert
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
          message={
            <span>
              {t('changePassword.initialPasswordLabel')}{' '}
              <Typography.Text code copyable style={{ fontSize: 13 }}>
                {initialPassword}
              </Typography.Text>
            </span>
          }
        />
      )}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={t('changePassword.oldPassword')}
          name="old_password"
          rules={[{ required: true, message: t('changePassword.error.oldPassword') }]}
          extra={initialPassword ? t('changePassword.oldPasswordHint') : undefined}
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
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label={t('changePassword.confirmPassword')}
          name="confirm_password"
          rules={[{ required: true, message: t('changePassword.error.confirmPassword') }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
