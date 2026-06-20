import { useEffect, useState } from 'react'
import {
  Button, Form, Input, Modal, Popconfirm, Radio, Space,
  Table, Tag, Tooltip, Typography, message, type TableProps,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { permissionsApi } from '../../api/permissions'
import { apiError } from '../../api/client'
import config from '../../config'
import type { Permission } from '../../types'

export default function PermissionsPage() {
  const { t } = useTranslation()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const pageSize = config.defaultPageSize

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await permissionsApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize })
      setPermissions(res.permissions)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const handleCreate = async (values: { module: string; action: string; operation?: string; description?: string }) => {
    setSubmitting(true)
    try {
      await permissionsApi.create(values)
      message.success(t('common.success'))
      setCreateOpen(false)
      createForm.resetFields()
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (values: { operation?: string; description?: string }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await permissionsApi.update(editing.id, values)
      message.success(t('common.success'))
      setEditOpen(false)
      load()
    } catch (err) { message.error(apiError(err)) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await permissionsApi.delete(id)
      message.success(t('common.success'))
      load()
    } catch (err) { message.error(apiError(err)) }
  }

  const columns: TableProps<Permission>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    {
      title: t('permissions.module'), dataIndex: 'module', width: 120,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: t('permissions.action'), dataIndex: 'action', width: 120,
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    { title: t('permissions.operation'), dataIndex: 'operation', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: t('common.description'), dataIndex: 'description', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: t('common.system'), dataIndex: 'system', width: 80,
      render: (v) => v ? <Tag color="blue">{t('common.yes')}</Tag> : null,
    },
    {
      title: t('common.actions'), width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => {
            setEditing(record)
            editForm.setFieldsValue({ operation: record.operation, description: record.description })
            setEditOpen(true)
          }} />
          <Popconfirm
            title={t('permissions.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            disabled={record.system}
          >
            <Tooltip title={record.system ? t('permissions.cannotDeleteSystem') : t('common.delete')}>
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
        <Typography.Title level={4} style={{ margin: 0 }}>{t('permissions.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true) }}>
          {t('permissions.createPermission')}
        </Button>
      </div>

      <Table
        rowKey="id" columns={columns} dataSource={permissions} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }) }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      {/* Create */}
      <Modal title={t('permissions.createPermission')} open={createOpen} onOk={() => createForm.submit()}
        onCancel={() => setCreateOpen(false)} confirmLoading={submitting}
        okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item label={t('permissions.module')} name="module"
            rules={[{ required: true, message: t('permissions.error.module') }]}>
            <Input placeholder={t('permissions.modulePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('permissions.action')} name="action"
            rules={[{ required: true, message: t('permissions.error.action') }]}>
            <Radio.Group
              options={[
                { value: 'read', label: t('permissions.actionRead') },
                { value: 'write', label: t('permissions.actionWrite') },
                { value: 'grant', label: t('permissions.actionGrant') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('permissions.operation')} name="operation">
            <Input placeholder={t('permissions.operationPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('common.description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit */}
      <Modal title={t('permissions.editPermission')} open={editOpen} onOk={() => editForm.submit()}
        onCancel={() => setEditOpen(false)} confirmLoading={submitting}
        okText={t('common.save')} cancelText={t('common.cancel')} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
          <Form.Item label={t('permissions.operation')} name="operation">
            <Input placeholder={t('permissions.operationPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('common.description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
