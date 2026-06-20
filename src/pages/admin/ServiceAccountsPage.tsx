import { useEffect, useState } from 'react'
import {
  Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space,
  Switch, Table, Tag, Tabs, Tooltip, Typography, message, type TableProps,
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, CopyOutlined, ApiOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { serviceAccountsApi } from '../../api/serviceAccounts'
import { rolesApi } from '../../api/roles'
import { apiError } from '../../api/client'
import config from '../../config'
import type { ServiceAccount, Role } from '../../types'

const { Text, Paragraph } = Typography

interface CreateFormValues {
  name: string
  description?: string
  expires_in_days?: number
  role_ids?: number[]
}

interface EditFormValues {
  description?: string
  disabled: boolean
  role_ids?: number[]
}

interface RegenerateFormValues {
  expires_in_days?: number
}

function buildCodeTemplates(token: string, baseUrl: string) {
  return {
    java: `// Maven: com.squareup.okhttp3:okhttp:4.x
OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
    .url("${baseUrl}/v1/your-endpoint")
    .header("Authorization", "Bearer ${token}")
    .header("Content-Type", "application/json")
    .get()
    .build();

try (Response response = client.newCall(request).execute()) {
    System.out.println(response.body().string());
}`,
    go: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET", "${baseUrl}/v1/your-endpoint", nil)
    req.Header.Set("Authorization", "Bearer ${token}")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`,
    rust: `// Cargo.toml: reqwest = { version = "0.11", features = ["blocking"] }
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::new();
    let resp = client
        .get("${baseUrl}/v1/your-endpoint")
        .header(AUTHORIZATION, "Bearer ${token}")
        .header(CONTENT_TYPE, "application/json")
        .send()?;
    println!("{}", resp.text()?);
    Ok(())
}`,
    python: `import requests

headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json",
}

response = requests.get(
    "${baseUrl}/v1/your-endpoint",
    headers=headers,
)
print(response.json())`,
  }
}

interface TokenModalProps {
  open: boolean
  token: string
  onClose: () => void
}

function TokenModal({ open, token, onClose }: TokenModalProps) {
  const { t } = useTranslation()
  const baseUrl = window.location.origin
  const templates = buildCodeTemplates(token, baseUrl)

  const copyToken = () => {
    navigator.clipboard.writeText(token).then(() => {
      message.success(t('serviceAccounts.tokenCopied'))
    })
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <ApiOutlined />
          {t('serviceAccounts.tokenTitle')}
        </Space>
      }
      onCancel={onClose}
      onOk={onClose}
      okText={t('common.confirm')}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={720}
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        message={t('serviceAccounts.tokenWarning')}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong>{t('serviceAccounts.tokenTitle')}</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-start' }}>
          <Paragraph
            code
            copyable={false}
            ellipsis={false}
            style={{
              flex: 1, margin: 0,
              padding: '6px 10px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 6,
              wordBreak: 'break-all',
              fontSize: 13,
            }}
          >
            {token}
          </Paragraph>
          <Button icon={<CopyOutlined />} onClick={copyToken}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>

      <Text strong>{t('serviceAccounts.tokenUsageTitle')}</Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 8, marginTop: 4 }}>
        {t('serviceAccounts.usageHint')}
      </Text>

      <Tabs
        size="small"
        items={[
          { key: 'java', label: t('serviceAccounts.tabs.java'), children: <CodeBlock code={templates.java} /> },
          { key: 'go', label: t('serviceAccounts.tabs.go'), children: <CodeBlock code={templates.go} /> },
          { key: 'rust', label: t('serviceAccounts.tabs.rust'), children: <CodeBlock code={templates.rust} /> },
          { key: 'python', label: t('serviceAccounts.tabs.python'), children: <CodeBlock code={templates.python} /> },
        ]}
      />
    </Modal>
  )
}

function CodeBlock({ code }: { code: string }) {
  const { t } = useTranslation()
  const copy = () => navigator.clipboard.writeText(code).then(() => message.success(t('serviceAccounts.tokenCopied')))
  return (
    <div style={{ position: 'relative' }}>
      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={copy}
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
      />
      <pre style={{
        padding: '12px 16px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.6,
        overflowX: 'auto',
        margin: 0,
        whiteSpace: 'pre',
      }}>
        {code}
      </pre>
    </div>
  )
}

export default function ServiceAccountsPage() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState<ServiceAccount[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ServiceAccount | null>(null)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenTarget, setRegenTarget] = useState<ServiceAccount | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [currentToken, setCurrentToken] = useState('')

  const [createForm] = Form.useForm<CreateFormValues>()
  const [editForm] = Form.useForm<EditFormValues>()
  const [regenForm] = Form.useForm<RegenerateFormValues>()

  const pageSize = config.defaultPageSize

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await serviceAccountsApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize })
      setAccounts(res.service_accounts ?? [])
      setTotal(res.total)
    } catch (e) {
      message.error(apiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    rolesApi.list({ page_size: 200 }).then((r) => setRoles(r.roles)).catch(() => {})
  }, [])

  const handleCreate = async (values: CreateFormValues) => {
    setSubmitting(true)
    try {
      const res = await serviceAccountsApi.create({
        name: values.name,
        description: values.description,
        expires_in_days: values.expires_in_days ?? 0,
        role_ids: values.role_ids ?? [],
      })
      setCreateOpen(false)
      createForm.resetFields()
      setCurrentToken(res.token)
      setTokenModalOpen(true)
      load(1)
      setPage(1)
    } catch (e) {
      message.error(apiError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (values: EditFormValues) => {
    if (!editTarget) return
    setSubmitting(true)
    try {
      await serviceAccountsApi.update(editTarget.id, {
        description: values.description,
        disabled: values.disabled,
        role_ids: values.role_ids ?? [],
      })
      message.success(t('common.success'))
      setEditOpen(false)
      load()
    } catch (e) {
      message.error(apiError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await serviceAccountsApi.delete(id)
      message.success(t('common.success'))
      load()
    } catch (e) {
      message.error(apiError(e))
    }
  }

  const handleRegen = async (values: RegenerateFormValues) => {
    if (!regenTarget) return
    setSubmitting(true)
    try {
      const res = await serviceAccountsApi.regenerateToken(regenTarget.id, values.expires_in_days ?? 0)
      setRegenOpen(false)
      regenForm.resetFields()
      setCurrentToken(res.token)
      setTokenModalOpen(true)
      load()
    } catch (e) {
      message.error(apiError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (svc: ServiceAccount) => {
    setEditTarget(svc)
    editForm.setFieldsValue({
      description: svc.description,
      disabled: svc.disabled,
      role_ids: (svc.roles ?? []).map((r) => r.id),
    })
    setEditOpen(true)
  }

  const openRegen = (svc: ServiceAccount) => {
    setRegenTarget(svc)
    regenForm.resetFields()
    setRegenOpen(true)
  }

  const columns: TableProps<ServiceAccount>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', key: 'id', width: 60 },
    {
      title: t('serviceAccounts.name'),
      dataIndex: 'name',
      key: 'name',
      render: (v, r) => (
        <Space>
          <Text strong>{v}</Text>
          {r.disabled && <Tag color="red">{t('serviceAccounts.disabled')}</Tag>}
        </Space>
      ),
    },
    { title: t('common.description'), dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: t('serviceAccounts.tokenPrefix'),
      dataIndex: 'token_prefix',
      key: 'token_prefix',
      render: (v: string) => (
        <Text code>{v}…</Text>
      ),
    },
    {
      title: t('serviceAccounts.roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Role[]) => (
        <Space wrap size={4}>
          {(roles ?? []).map((r) => <Tag key={r.id}>{r.name}</Tag>)}
        </Space>
      ),
    },
    {
      title: t('serviceAccounts.expiresAt'),
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString() : <Text type="secondary">{t('serviceAccounts.neverExpires')}</Text>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" onClick={() => openEdit(record)}>{t('common.edit')}</Button>
          <Tooltip title={t('serviceAccounts.regenerate')}>
            <Popconfirm
              title={t('serviceAccounts.regenerateConfirm', { name: record.name })}
              onConfirm={() => openRegen(record)}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
            >
              <Button size="small" icon={<ReloadOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Popconfirm
            title={t('serviceAccounts.deleteConfirm', { name: record.name })}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>{t('serviceAccounts.title')}</Typography.Title>
          <Typography.Text type="secondary">{t('serviceAccounts.subtitle')}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true) }}>
          {t('serviceAccounts.create')}
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={accounts}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }), styles: { item: { borderRadius: 999 } } }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title={t('serviceAccounts.create')}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('serviceAccounts.name')} rules={[{ required: true, message: t('serviceAccounts.nameRequired') }]}>
            <Input placeholder={t('serviceAccounts.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('serviceAccounts.description')}>
            <Input placeholder={t('serviceAccounts.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="expires_in_days" label={t('serviceAccounts.expiresInDays')}>
            <InputNumber min={0} placeholder={t('serviceAccounts.expiresInDaysPlaceholder')} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="role_ids" label={t('serviceAccounts.roles')}>
            <Select
              mode="multiple"
              placeholder={t('serviceAccounts.rolesPlaceholder')}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={`${t('serviceAccounts.edit')}${editTarget ? ` — ${editTarget.name}` : ''}`}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
          <Form.Item name="description" label={t('serviceAccounts.description')}>
            <Input placeholder={t('serviceAccounts.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="disabled" label={t('common.disabled')} valuePropName="checked">
            <Switch checkedChildren={t('serviceAccounts.disabled')} unCheckedChildren={t('serviceAccounts.enabled')} />
          </Form.Item>
          <Form.Item name="role_ids" label={t('serviceAccounts.roles')}>
            <Select
              mode="multiple"
              placeholder={t('serviceAccounts.rolesPlaceholder')}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Regenerate Token Modal */}
      <Modal
        open={regenOpen}
        title={`${t('serviceAccounts.regenerate')}${regenTarget ? ` — ${regenTarget.name}` : ''}`}
        onCancel={() => setRegenOpen(false)}
        onOk={() => regenForm.submit()}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={regenForm} layout="vertical" onFinish={handleRegen} style={{ marginTop: 16 }}>
          <Form.Item name="expires_in_days" label={t('serviceAccounts.expiresInDays')}>
            <InputNumber min={0} placeholder={t('serviceAccounts.expiresInDaysPlaceholder')} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Token Display Modal */}
      <TokenModal
        open={tokenModalOpen}
        token={currentToken}
        onClose={() => setTokenModalOpen(false)}
      />
    </div>
  )
}
