import { useEffect, useState } from 'react'
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space,
  Table, Tag, Tooltip, Typography, message, type TableProps,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined, ApartmentOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { rolesApi } from '../../api/roles'
import { permissionsApi } from '../../api/permissions'
import { apiError } from '../../api/client'
import config from '../../config'
import type { Role, Permission } from '../../types'

export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [permOpen, setPermOpen] = useState(false)
  const [inheritOpen, setInheritOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [permForm] = Form.useForm()
  const [inheritForm] = Form.useForm()

  const pageSize = config.defaultPageSize

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await rolesApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize })
      setRoles(res.roles)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    permissionsApi.list({ page_size: 500 }).then((r) => setAllPerms(r.permissions))
    rolesApi.list({ page_size: 100 }).then((r) => setAllRoles(r.roles))
  }, [])

  const handleCreate = async (values: { name: string; description?: string; permission_ids?: number[]; inherited_role_ids?: number[] }) => {
    setSubmitting(true)
    try {
      await rolesApi.create(values)
      message.success(t('common.success'))
      setCreateOpen(false)
      createForm.resetFields()
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (values: { description?: string }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await rolesApi.update(editing.id, values)
      message.success(t('common.success'))
      setEditOpen(false)
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleAssignPerms = async (values: { permission_ids: number[] }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await rolesApi.assignPermissions(editing.id, values.permission_ids ?? [])
      message.success(t('common.success'))
      setPermOpen(false)
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleSetInherit = async (values: { inherited_role_ids: number[] }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await rolesApi.setInheritances(editing.id, values.inherited_role_ids ?? [])
      message.success(t('common.success'))
      setInheritOpen(false)
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await rolesApi.delete(id)
      message.success(t('common.success'))
      load()
    } catch (err) { message.error(apiError(err)) }
  }

  const permLabel = (p: Permission) => `${p.module}:${p.action}${p.description ? ` — ${p.description}` : ''}`

  const columns: TableProps<Role>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    {
      title: t('roles.name'), dataIndex: 'name', ellipsis: true,
      render: (v, r) => <Space size={4}>{v}{r.system && <Tag color="blue">{t('common.system')}</Tag>}</Space>,
    },
    { title: t('common.description'), dataIndex: 'description', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: t('roles.permissions'), dataIndex: 'permissions',
      render: (perms: Permission[]) => (
        <Tag>{perms?.length ?? 0}</Tag>
      ),
    },
    {
      title: t('roles.inheritedRoles'), dataIndex: 'inherited_roles',
      render: (inherited: Role[]) => (
        <Space wrap size={4}>
          {inherited?.map((r) => <Tag key={r.id}>{r.name}</Tag>)}
        </Space>
      ),
    },
    {
      title: t('common.actions'), width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('roles.editRole')}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => {
              setEditing(record)
              editForm.setFieldsValue({ description: record.description })
              setEditOpen(true)
            }} />
          </Tooltip>
          <Tooltip title={t('roles.assignPermissions')}>
            <Button type="text" size="small" icon={<SafetyOutlined />} onClick={() => {
              setEditing(record)
              permForm.setFieldsValue({ permission_ids: record.permissions?.map((p) => p.id) ?? [] })
              setPermOpen(true)
            }} />
          </Tooltip>
          <Tooltip title={t('roles.setInheritances')}>
            <Button type="text" size="small" icon={<ApartmentOutlined />} onClick={() => {
              setEditing(record)
              inheritForm.setFieldsValue({ inherited_role_ids: record.inherited_roles?.map((r) => r.id) ?? [] })
              setInheritOpen(true)
            }} />
          </Tooltip>
          <Popconfirm
            title={t('roles.deleteConfirm', { name: record.name })}
            onConfirm={() => handleDelete(record.id)}
            disabled={record.system}
          >
            <Tooltip title={record.system ? t('roles.cannotDeleteSystem') : t('common.delete')}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={record.system} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('roles.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true) }}>
          {t('roles.createRole')}
        </Button>
      </div>

      <Table
        rowKey="id" columns={columns} dataSource={roles} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }) }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      {/* Create */}
      <Modal title={t('roles.createRole')} open={createOpen} onOk={() => createForm.submit()}
        onCancel={() => setCreateOpen(false)} confirmLoading={submitting}
        okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item label={t('roles.name')} name="name" rules={[{ required: true, message: t('roles.error.name') }]}>
            <Input placeholder={t('roles.namePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('common.description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t('roles.assignPermissions')} name="permission_ids">
            <Select mode="multiple" placeholder={t('roles.selectPermissions')} allowClear
              options={allPerms.map((p) => ({ value: p.id, label: permLabel(p) }))} />
          </Form.Item>
          <Form.Item label={t('roles.inheritedRoles')} name="inherited_role_ids">
            <Select mode="multiple" placeholder={t('roles.selectRoles')} allowClear
              options={allRoles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit */}
      <Modal title={t('roles.editRole')} open={editOpen} onOk={() => editForm.submit()}
        onCancel={() => setEditOpen(false)} confirmLoading={submitting}
        okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
          <Form.Item label={t('common.description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Permissions */}
      <Modal title={`${t('roles.assignPermissions')} — ${editing?.name}`} open={permOpen}
        onOk={() => permForm.submit()} onCancel={() => setPermOpen(false)}
        confirmLoading={submitting} okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={permForm} layout="vertical" onFinish={handleAssignPerms} style={{ marginTop: 16 }}>
          <Form.Item label={t('roles.assignPermissions')} name="permission_ids">
            <Select mode="multiple" placeholder={t('roles.selectPermissions')} allowClear style={{ width: '100%' }}
              options={allPerms.map((p) => ({ value: p.id, label: permLabel(p) }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Set Inheritances */}
      <Modal title={`${t('roles.setInheritances')} — ${editing?.name}`} open={inheritOpen}
        onOk={() => inheritForm.submit()} onCancel={() => setInheritOpen(false)}
        confirmLoading={submitting} okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={inheritForm} layout="vertical" onFinish={handleSetInherit} style={{ marginTop: 16 }}>
          <Form.Item label={t('roles.inheritedRoles')} name="inherited_role_ids">
            <Select mode="multiple" placeholder={t('roles.selectRoles')} allowClear style={{ width: '100%' }}
              options={allRoles.filter((r) => r.id !== editing?.id).map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
