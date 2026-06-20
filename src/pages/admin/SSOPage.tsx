import { useEffect, useState } from 'react'
import {
  Alert, Badge, Button, Card, Col, Divider, Form, Input, Modal,
  Popconfirm, Radio, Row, Select, Space, Switch, Table, Tag, Typography,
  message, type TableProps,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined,
  CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ssoApi } from '../../api/sso'
import { apiError } from '../../api/client'
import { useAuthSettingsStore } from '../../store/authSettings'
import type { SSOProvider } from '../../types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

type ProviderType = SSOProvider['type']

const TYPE_LABELS: Record<ProviderType, { label: string; color: string }> = {
  oauth1:  { label: 'OAuth 1.0', color: 'geekblue' },
  oauth2:  { label: 'OAuth 2.0', color: 'blue' },
  oidc:    { label: 'OIDC',      color: 'purple' },
  saml1:   { label: 'SAML 1.0', color: 'orange' },
  saml2:   { label: 'SAML 2.0', color: 'volcano' },
  ldap:    { label: 'LDAP',     color: 'cyan' },
}

// ── Per-protocol field definitions ─────────────────────────────────────────
interface FieldDef { key: string; label: string; textarea?: boolean; password?: boolean; hint?: string; required?: boolean; radioOptions?: { value: string; label: string }[] }

const FIELDS: Record<ProviderType, FieldDef[]> = {
  oauth1: [
    { key: 'consumer_key',       label: 'Consumer Key',       required: true },
    { key: 'consumer_secret',    label: 'Consumer Secret',    password: true, required: true },
    { key: 'request_token_url',  label: 'Request Token URL',  required: true },
    { key: 'access_token_url',   label: 'Access Token URL',   required: true },
    { key: 'authorize_url',      label: 'Authorize URL',      required: true },
    { key: 'user_info_url',      label: 'User Info URL',      required: true },
    { key: 'user_attr_username', label: 'Username Attribute', hint: 'default: login' },
    { key: 'user_attr_email',    label: 'Email Attribute',    hint: 'default: email' },
    { key: 'user_attr_name',     label: 'Name Attribute',     hint: 'default: name' },
  ],
  oauth2: [
    { key: 'client_id',          label: 'Client ID',          required: true },
    { key: 'client_secret',      label: 'Client Secret',      password: true, required: true },
    { key: 'authorize_url',      label: 'Authorization URL',  required: true },
    { key: 'token_url',          label: 'Token URL',          required: true },
    { key: 'user_info_url',      label: 'User Info URL',      required: true },
    { key: 'scopes',             label: 'Scopes',             hint: 'space-separated, e.g. openid profile email' },
    { key: 'pkce',               label: 'PKCE',               hint: 'true / false' },
    { key: 'user_attr_username', label: 'Username Attribute', hint: 'default: login' },
    { key: 'user_attr_email',    label: 'Email Attribute',    hint: 'default: email' },
    { key: 'user_attr_name',     label: 'Name Attribute',     hint: 'default: name' },
  ],
  oidc: [
    { key: 'client_id',          label: 'Client ID',    required: true },
    { key: 'client_secret',      label: 'Client Secret', password: true, required: true },
    { key: 'issuer',             label: 'Issuer URL',   required: true, hint: 'e.g. https://accounts.google.com' },
    { key: 'scopes',             label: 'Scopes',       hint: 'default: openid profile email' },
    { key: 'pkce',               label: 'PKCE',         hint: 'true / false' },
    { key: 'user_attr_username', label: 'Username Claim', hint: 'default: preferred_username' },
    { key: 'user_attr_email',    label: 'Email Claim',    hint: 'default: email' },
    { key: 'user_attr_name',     label: 'Name Claim',     hint: 'default: name' },
  ],
  saml1: [
    { key: 'entity_id',          label: 'SP Entity ID',   required: true },
    { key: 'sso_url',            label: 'IdP SSO URL',    required: true },
    { key: 'slo_url',            label: 'IdP SLO URL' },
    { key: 'idp_certificate',    label: 'IdP Certificate (PEM)', textarea: true, required: true },
    { key: 'name_id_format',     label: 'Name ID Format', hint: 'email / persistent / transient' },
    { key: 'attr_username',      label: 'Username Attribute' },
    { key: 'attr_email',         label: 'Email Attribute' },
    { key: 'attr_display_name',  label: 'Display Name Attribute' },
  ],
  saml2: [
    { key: 'entity_id',          label: 'SP Entity ID',        required: true },
    { key: 'sso_url',            label: 'IdP SSO URL',         required: true },
    { key: 'slo_url',            label: 'IdP SLO URL' },
    { key: 'idp_certificate',    label: 'IdP Certificate (PEM)', textarea: true, required: true },
    { key: 'sp_private_key',     label: 'SP Private Key (PEM)', textarea: true },
    { key: 'sp_certificate',     label: 'SP Certificate (PEM)', textarea: true },
    { key: 'name_id_format',     label: 'Name ID Format',       hint: 'email / persistent / transient' },
    { key: 'sign_requests',      label: 'Sign Requests',        hint: 'true / false' },
    { key: 'attr_username',      label: 'Username Attribute' },
    { key: 'attr_email',         label: 'Email Attribute' },
    { key: 'attr_display_name',  label: 'Display Name Attribute' },
  ],
  ldap: [
    { key: 'host',               label: 'Host',             required: true },
    { key: 'port',               label: 'Port',             hint: 'default: 389 (636 for LDAPS)' },
    { key: 'tls', label: 'TLS Mode', radioOptions: [
        { value: 'none',     label: 'None' },
        { value: 'starttls', label: 'StartTLS' },
        { value: 'tls',      label: 'TLS' },
      ]},
    { key: 'skip_tls_verify', label: 'Skip TLS Verify', radioOptions: [
        { value: 'false', label: 'No' },
        { value: 'true',  label: 'Yes' },
      ]},
    { key: 'bind_dn',            label: 'Bind DN',          required: true },
    { key: 'bind_password',      label: 'Bind Password',    password: true, required: true },
    { key: 'base_dn',            label: 'Base DN',          required: true },
    { key: 'user_filter',        label: 'User Filter',      hint: 'e.g. (uid={username})' },
    { key: 'group_base_dn',      label: 'Group Base DN' },
    { key: 'group_filter',       label: 'Group Filter' },
    { key: 'attr_username',      label: 'Username Attribute', hint: 'default: uid' },
    { key: 'attr_email',         label: 'Email Attribute',    hint: 'default: mail' },
    { key: 'attr_display_name',  label: 'Display Name Attribute', hint: 'default: cn' },
  ],
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SSOPage() {
  const { t } = useTranslation()
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SSOProvider | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<ProviderType>('oauth2')
  const [form] = Form.useForm()
  const { localAuthEnabled, setLocalAuthEnabled } = useAuthSettingsStore()

  const load = async () => {
    setLoading(true)
    try { setProviders(await ssoApi.list(true)) }
    catch (err) { message.error(apiError(err)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setSelectedType('oauth2')
    form.resetFields()
    form.setFieldsValue({ type: 'oauth2', enabled: false, sort_order: 0, icon: '' })
    setModalOpen(true)
  }

  const openEdit = (p: SSOProvider) => {
    setEditing(p)
    setSelectedType(p.type)
    form.resetFields()
    form.setFieldsValue({
      name: p.name,
      type: p.type,
      enabled: p.enabled,
      icon: p.icon,
      sort_order: p.sort_order,
      ...p.config,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: Record<string, string | boolean | number>) => {
    const { name, type, enabled, icon, sort_order, ...configValues } = values
    if (enabled) {
      const enabledCount = providers.filter((x) => x.enabled && x.id !== (editing?.id ?? -1)).length
      if (enabledCount >= 1) {
        message.error(t('sso.tooManyEnabled'))
        return
      }
    }
    const config: Record<string, string> = {}
    for (const [k, v] of Object.entries(configValues)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        config[k] = String(v)
      }
    }
    setSubmitting(true)
    try {
      const payload = {
        name: name as string,
        enabled: Boolean(enabled),
        icon: (icon as string) || '',
        sort_order: Number(sort_order) || 0,
        config,
      }
      if (editing) {
        await ssoApi.update(editing.id, payload)
      } else {
        await ssoApi.create({ ...payload, type: type as string })
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
      await ssoApi.delete(id)
      message.success(t('common.success'))
      load()
    } catch (err) { message.error(apiError(err)) }
  }

  const handleToggle = async (p: SSOProvider) => {
    if (!p.enabled) {
      const enabledCount = providers.filter((x) => x.enabled && x.id !== p.id).length
      if (enabledCount >= 1) {
        message.error(t('sso.tooManyEnabled'))
        return
      }
    }
    try {
      await ssoApi.update(p.id, {
        name: p.name, enabled: !p.enabled, icon: p.icon,
        sort_order: p.sort_order, config: p.config,
      })
      load()
    } catch (err) { message.error(apiError(err)) }
  }

  const columns: TableProps<SSOProvider>['columns'] = [
    {
      title: t('common.id'), dataIndex: 'id', width: 60,
    },
    {
      title: t('sso.provider'), dataIndex: 'name',
      render: (name: string, r) => (
        <Space>
          {r.icon && <span style={{ fontSize: 18 }}>{r.icon}</span>}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: t('sso.protocol'), dataIndex: 'type',
      render: (type: ProviderType) => {
        const meta = TYPE_LABELS[type] ?? { label: type, color: 'default' }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: t('users.status'), dataIndex: 'enabled', width: 90,
      render: (enabled: boolean, r) => (
        <Switch
          size="small"
          checked={enabled}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<StopOutlined />}
          onChange={() => handleToggle(r)}
        />
      ),
    },
    {
      title: t('sso.sortOrder'), dataIndex: 'sort_order', width: 80,
    },
    {
      title: t('common.actions'), width: 100,
      render: (_, r) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title={t('sso.deleteConfirm', { name: r.name })}
            onConfirm={() => handleDelete(r.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const fields = FIELDS[selectedType] ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('sso.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('sso.create')}
        </Button>
      </div>

      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={2}>
              <Text strong>{t('sso.localAuth')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('sso.localAuthDesc')}</Text>
            </Space>
          </Col>
          <Col>
            <Switch
              checked={localAuthEnabled}
              checkedChildren={t('common.enabled')}
              unCheckedChildren={t('common.disabled')}
              onChange={(checked) => {
                if (!checked) {
                  const hasEnabled = providers.some((p) => p.enabled)
                  if (!hasEnabled) {
                    message.warning(t('sso.localAuthDisableWarning'))
                    return
                  }
                }
                setLocalAuthEnabled(checked)
              }}
            />
          </Col>
        </Row>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t('sso.callbackHint')}
        description={`${window.location.origin}/v1/sso/callback/{id}`}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Divider orientation="left" style={{ marginTop: 0 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>{t('sso.externalProviders')}</Text>
      </Divider>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={providers}
        loading={loading}
        pagination={false}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal
        title={editing ? t('sso.edit') : t('sso.create')}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        width={640}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={t('common.name')} name="name" rules={[{ required: true }]}>
                <Input placeholder={t('sso.namePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={t('sso.icon')} name="icon">
                <Input placeholder="🔐" maxLength={4} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={t('sso.sortOrder')} name="sort_order">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={t('sso.protocol')} name="type" rules={[{ required: true }]}>
                <Select
                  disabled={Boolean(editing)}
                  onChange={(v) => setSelectedType(v as ProviderType)}
                  options={Object.entries(TYPE_LABELS).map(([v, m]) => ({ value: v, label: m.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('users.status')} name="enabled" valuePropName="checked"
                getValueProps={(v) => ({ checked: Boolean(v) })}
                getValueFromEvent={(c: boolean) => c}>
                <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '4px 0 16px' }}>
            <Tag color={TYPE_LABELS[selectedType]?.color}>{TYPE_LABELS[selectedType]?.label}</Tag>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{t('sso.configSection')}</Text>
          </Divider>

          {fields.map((f) => (
            <Form.Item
              key={f.key}
              label={f.label}
              name={f.key}
              rules={f.required ? [{ required: true, message: `${f.label} ${t('sso.required')}` }] : []}
              extra={f.hint ? <Text type="secondary" style={{ fontSize: 11 }}>{f.hint}</Text> : undefined}
            >
              {f.radioOptions ? (
                <Radio.Group options={f.radioOptions} />
              ) : f.textarea ? (
                <TextArea rows={4} style={{ fontFamily: 'monospace', fontSize: 12 }} />
              ) : f.password ? (
                <Input.Password autoComplete="new-password" />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Protocol reference cards */}
      <Divider style={{ marginTop: 32 }}>{t('sso.reference')}</Divider>
      <Row gutter={[12, 12]}>
        {(Object.entries(FIELDS) as [ProviderType, FieldDef[]][]).map(([type, flds]) => (
          <Col key={type} xs={24} sm={12} lg={8}>
            <Card
              size="small"
              title={<Tag color={TYPE_LABELS[type].color}>{TYPE_LABELS[type].label}</Tag>}
              style={{ borderRadius: 10 }}
            >
              <Paragraph style={{ margin: 0, fontSize: 12 }}>
                {flds.filter((f) => f.required).map((f) => (
                  <div key={f.key}>
                    <Text type="secondary">• </Text>
                    <Text strong style={{ fontSize: 12 }}>{f.label}</Text>
                    {f.hint && <Text type="secondary" style={{ fontSize: 11 }}> ({f.hint})</Text>}
                  </div>
                ))}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
