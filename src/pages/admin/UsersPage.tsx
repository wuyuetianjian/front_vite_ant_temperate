import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space, Switch,
  Table, Tag, Typography, message, type TableProps,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usersApi } from '../../api/users'
import { rolesApi } from '../../api/roles'
import { authApi } from '../../api/auth'
import { ssoApi } from '../../api/sso'
import { apiError } from '../../api/client'
import { useSystemSettingsStore } from '../../store/systemSettings'
import config from '../../config'
import type { User, Role, SSOProvider } from '../../types'

type FormMode = 'create' | 'edit'

interface FormValues {
  username: string
  password: string
  display_name: string
  disabled: boolean
  role_ids: number[]
}

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<FormMode>('create')
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const totpSystemEnabled = useSystemSettingsStore((s) => s.settings.totp_enabled)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pageSize = config.defaultPageSize

  const sourceLabels = useMemo(() => {
    const labels: Record<string, string> = {
      local: 'Local (LOCAL)',
      ldap: 'LDAP (LDAP)',
      oauth1: 'OAUTH1 (OAUTH1)',
      oauth2: 'OAUTH2 (OAUTH2)',
      oidc: 'OIDC (OIDC)',
      saml1: 'SAML1 (SAML1)',
      saml2: 'SAML2 (SAML2)',
    }
    ssoProviders.forEach((provider) => {
      const type = provider.type.toLowerCase()
      const protocol = provider.type.toUpperCase()
      const name = provider.name || protocol
      if (!labels[type] || labels[type] === `${protocol} (${protocol})`) {
        labels[type] = `${name} (${protocol})`
      }
    })
    return labels
  }, [ssoProviders])

  const sourceLabel = (source: string) => {
    const normalized = (source || 'local').toLowerCase()
    return sourceLabels[normalized] ?? (source || 'Local')
  }

  const load = async (p = page, q = search) => {
    setLoading(true)
    try {
      const params: { page_size: number; page_token: number; search?: string } = {
        page_size: pageSize,
        page_token: (p - 1) * pageSize,
      }
      if (q) params.search = q
      const res = await usersApi.list(params)
      setUsers(res.users)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(1, value)
    }, 300)
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    rolesApi.list({ page_size: 100 }).then((r) => setRoles(r.roles))
    ssoApi.list(true).then(setSsoProviders).catch(() => setSsoProviders([]))
  }, [])

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ disabled: false, role_ids: [] })
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setMode('edit')
    setEditing(user)
    form.setFieldsValue({
      display_name: user.display_name,
      disabled: user.disabled,
      role_ids: (user.roles ?? []).filter((r) => r.name !== '_effective').map((r) => r.id),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      if (mode === 'create') {
        await usersApi.create({
          username: values.username,
          password: values.password,
          display_name: values.display_name,
          disabled: values.disabled,
          role_ids: values.role_ids ?? [],
        })
      } else if (editing) {
        const beforeRoles = (editing.roles ?? [])
          .filter((r) => r.name !== '_effective').map((r) => r.name).sort()
        const afterRoles = roles
          .filter((r) => (values.role_ids ?? []).includes(r.id)).map((r) => r.name).sort()
        const before: Record<string, unknown> = {
          display_name: editing.display_name ?? '',
          disabled: editing.disabled ?? false,
          roles: beforeRoles,
        }
        const after: Record<string, unknown> = {
          display_name: values.display_name ?? '',
          disabled: values.disabled ?? false,
          roles: afterRoles,
        }
        const diffBefore: Record<string, unknown> = {}
        const diffAfter: Record<string, unknown> = {}
        for (const k of Object.keys(before)) {
          if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
            diffBefore[k] = before[k]
            diffAfter[k] = after[k]
          }
        }
        const detail = Object.keys(diffBefore).length > 0
          ? JSON.stringify({ before: diffBefore, after: diffAfter })
          : undefined
        await usersApi.update(editing.id, {
          display_name: values.display_name,
          disabled: values.disabled,
          role_ids: values.role_ids ?? [],
        }, detail)
      }
      message.success(t('common.success'))
      setModalOpen(false)
      load()
    } catch (err) {
      message.error(apiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await usersApi.delete(id)
      message.success(t('common.success'))
      load()
    } catch (err) {
      message.error(apiError(err))
    }
  }

  const handleAdminReset2FA = async (user: User) => {
    try {
      await authApi.adminReset2FA(user.id)
      message.success(t('twoFactor.resetSuccess'))
      load()
    } catch (err) {
      message.error(apiError(err))
    }
  }

  const handleResetPassword = async (user: User) => {
    setResetSubmitting(true)
    try {
      const result = await usersApi.resetPassword(user.id)
      message.success(t('users.resetPasswordSuccess'))
      Modal.success({
        title: t('users.resetPasswordResultTitle', { name: user.username }),
        content: (
          <Typography.Paragraph copyable style={{ marginBottom: 0, marginTop: 12 }}>
            {result.password}
          </Typography.Paragraph>
        ),
      })
      load()
    } catch (err) {
      message.error(apiError(err))
    } finally {
      setResetSubmitting(false)
    }
  }

  const columns: TableProps<User>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('users.username'), dataIndex: 'username', ellipsis: true },
    { title: t('users.displayName'), dataIndex: 'display_name', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: t('users.email'), dataIndex: 'email', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: t('users.roles'),
      dataIndex: 'roles',
      render: (roleList: Role[] | undefined) => (
        <Space wrap size={4}>
          {(roleList ?? []).filter((r) => r.name !== '_effective').map((r) => (
            <Tag key={r.id} color={r.system ? 'blue' : 'default'}>{r.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('users.source'),
      width: 120,
      render: (_: unknown, record: User) => {
        const colorMap: Record<string, string> = { local: 'default', ldap: 'cyan', oidc: 'geekblue', saml1: 'purple', saml2: 'purple' }
        const sources = record.auth_sources?.length ? record.auth_sources : [record.source || 'local']
        return (
          <Space size={4} wrap>
            {sources.map((src) => (
              <Tag key={src} color={colorMap[src.toLowerCase()] ?? 'default'}>{sourceLabel(src)}</Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: t('users.status'),
      dataIndex: 'disabled',
      width: 90,
      render: (disabled: boolean) => (
        <Tag color={disabled ? 'error' : 'success'}>
          {disabled ? t('common.disabled') : t('common.enabled')}
        </Tag>
      ),
    },
    ...(totpSystemEnabled ? [{
      title: t('twoFactor.title'),
      dataIndex: 'totp_enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'} icon={<SafetyCertificateOutlined />}>
          {enabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
        </Tag>
      ),
    }] : []),
    {
      title: t('common.actions'),
      width: totpSystemEnabled ? 200 : 160,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          {(record.source || 'local') === 'local' && (
            <Popconfirm
              title={t('users.resetPasswordConfirm', { name: record.username })}
              onConfirm={() => handleResetPassword(record)}
            >
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
                title={t('users.resetPassword')}
                loading={resetSubmitting}
              />
            </Popconfirm>
          )}
          {totpSystemEnabled && record.totp_enabled && (
            <Popconfirm
              title={t('twoFactor.adminResetConfirm', { name: record.username })}
              onConfirm={() => handleAdminReset2FA(record)}
            >
              <Button type="text" size="small" icon={<SafetyCertificateOutlined />} title={t('twoFactor.adminReset')} />
            </Popconfirm>
          )}
          <Popconfirm
            title={t('users.deleteConfirm', { name: record.username })}
            onConfirm={() => handleDelete(record.id)}
            disabled={record.system}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={record.system} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('users.title')}</Typography.Title>
        <Space>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--ant-color-text-quaternary)' }} />}
            placeholder={t('users.searchPlaceholder')}
            allowClear
            style={{ width: 220 }}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('users.createUser')}
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => { setPage(p); load(p, search) },
          showTotal: (n) => t('common.total', { count: n }),
          styles: { item: { borderRadius: 999 } },
        }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal
        title={mode === 'create' ? t('users.createUser') : t('users.editUser')}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          {mode === 'create' && (
            <Form.Item
              label={t('users.username')}
              name="username"
              rules={[{ required: true, message: t('users.error.username') }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          )}
          {mode === 'create' && (
            <Form.Item
              label={t('users.password')}
              name="password"
              rules={[
                { required: true, message: t('users.error.password') },
                { min: 6, message: t('users.error.passwordMin') },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          )}
          <Form.Item label={t('users.displayName')} name="display_name">
            <Input placeholder={t('users.displayNamePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('users.roles')} name="role_ids">
            <Select
              mode="multiple"
              placeholder={t('roles.selectRoles')}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              allowClear
            />
          </Form.Item>
          <Form.Item
            label={t('users.status')}
            name="disabled"
            valuePropName="checked"
            getValueProps={(v) => ({ checked: !v })}
            getValueFromEvent={(checked: boolean) => !checked}
          >
            <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}
