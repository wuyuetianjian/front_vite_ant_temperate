import { useEffect, useState } from 'react'
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space, Switch,
  Table, Tag, Typography, message, type TableProps,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usersApi } from '../../api/users'
import { rolesApi } from '../../api/roles'
import { apiError } from '../../api/client'
import config from '../../config'
import type { User, Role } from '../../types'

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
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<FormMode>('create')
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const pageSize = config.defaultPageSize

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await usersApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize })
      setUsers(res.users)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    rolesApi.list({ page_size: 100 }).then((r) => setRoles(r.roles))
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

  const columns: TableProps<User>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('users.username'), dataIndex: 'username', ellipsis: true },
    { title: t('users.displayName'), dataIndex: 'display_name', ellipsis: true,
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
      title: t('users.status'),
      dataIndex: 'disabled',
      width: 90,
      render: (disabled: boolean) => (
        <Tag color={disabled ? 'error' : 'success'}>
          {disabled ? t('common.disabled') : t('common.enabled')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('users.createUser')}
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }), styles: { item: { borderRadius: 999 } } }}
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
