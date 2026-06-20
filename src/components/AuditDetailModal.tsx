import { Popover, Space, Tag, Typography } from 'antd'
import { FileSearchOutlined } from '@ant-design/icons'
import type { AuditLogEntry } from '../types'

const { Text } = Typography

const mutedText: React.CSSProperties = { color: 'var(--glass-text-secondary)' }
const emptyValue = <Text type="secondary">—</Text>

const FIELD_LABELS: Record<string, string> = {
  action: '动作',
  audit_log_retention_days: '审计日志保留天数',
  browser: '浏览器',
  config: '配置',
  description: '描述',
  expires_at: '过期时间',
  expires_in_days: '有效期天数',
  disabled: '禁用状态',
  display_name: '显示名称',
  enabled: '启用状态',
  icon: '图标',
  inherited_roles: '继承角色',
  ip: 'IP',
  kicked_by: '操作人',
  last_access_at: '最后访问时间',
  login_at: '登录时间',
  module: '模块',
  name: '名称',
  operation: '操作',
  os: '系统',
  permissions: '权限',
  roles: '角色',
  service_account: '服务账号',
  session_id: '会话 ID',
  session_log_retention_days: '在线会话保留天数',
  sort_order: '排序',
  status: '状态',
  token_prefix: '令牌前缀',
  token_regenerated: '令牌已重置',
  type: '类型',
  username: '用户',
}

const RESOURCE_LABELS: Record<string, string> = {
  permission: '权限',
  role: '角色',
  session: '会话',
  service_account: '服务账号',
  settings: '系统设置',
  sso_provider: '单点登录',
  user: '用户',
}

// ── value renderers ──────────────────────────────────────────────

function formatDateString(v: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(v)) return v
  const date = new Date(v)
  return Number.isNaN(date.getTime()) ? v : date.toLocaleString()
}

function renderObject(v: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(v)
  if (entries.length === 0) return emptyValue
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{FIELD_LABELS[key] ?? key}</Text>
          <div style={{ minWidth: 0 }}>{renderScalar(value)}</div>
        </div>
      ))}
    </div>
  )
}

function renderScalar(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === '') return emptyValue
  if (typeof v === 'boolean') {
    return <Tag color={v ? 'success' : 'default'}>{v ? '是' : '否'}</Tag>
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return emptyValue
    return <Space wrap size={4}>{v.map((item, index) => <Tag key={`${String(item)}-${index}`}>{String(item)}</Tag>)}</Space>
  }
  if (typeof v === 'object') return renderObject(v as Record<string, unknown>)
  if (typeof v === 'string') return <Text>{formatDateString(v)}</Text>
  return <Text>{String(v)}</Text>
}

function ArrayDiff({ before, after }: { before: string[]; after: string[] }) {
  const bSet = new Set(before)
  const aSet = new Set(after)
  const all = Array.from(new Set([...before, ...after]))
  return (
    <Space wrap size={4}>
      {all.map((item) => {
        if (bSet.has(item) && aSet.has(item)) return <Tag key={item}>{item}</Tag>
        if (bSet.has(item)) return <Tag key={item} color="error" style={{ textDecoration: 'line-through' }}>- {item}</Tag>
        return <Tag key={item} color="success">+ {item}</Tag>
      })}
    </Space>
  )
}

function renderDiffCell(v: unknown, other: unknown, side: 'before' | 'after'): React.ReactNode {
  if (Array.isArray(v) && Array.isArray(other)) {
    const before = side === 'before' ? v.map(String) : (other as unknown[]).map(String)
    const after = side === 'after' ? v.map(String) : (other as unknown[]).map(String)
    return <ArrayDiff before={before} after={after} />
  }
  return renderScalar(v)
}

// ── detail tables ────────────────────────────────────────────────

function DetailTable({ fields }: { fields: Record<string, unknown> }) {
  const keys = Object.keys(fields)
  if (keys.length === 0) return <Text type="secondary">暂无详情</Text>

  const td: React.CSSProperties = { padding: '7px 10px', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0', fontSize: 12 }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {keys.map((key) => (
          <tr key={key}>
            <td style={{ ...td, width: 150, color: '#555', fontWeight: 500, background: '#fafafa' }}>{FIELD_LABELS[key] ?? key}</td>
            <td style={td}>{renderScalar(fields[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DiffTable({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  )
  if (keys.length === 0) return <Text type="secondary">无字段变更</Text>

  const th: React.CSSProperties = { padding: '7px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #f0f0f0' }
  const td: React.CSSProperties = { padding: '7px 10px', verticalAlign: 'top', borderBottom: '1px solid #f0f0f0', fontSize: 12 }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#fafafa' }}>
          <th style={{ ...th, width: '22%' }}>字段</th>
          <th style={{ ...th, width: '39%', background: '#fff1f0', color: '#cf1322' }}>修改前</th>
          <th style={{ ...th, width: '39%', background: '#f6ffed', color: '#389e0d' }}>修改后</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => (
          <tr key={key}>
            <td style={{ ...td, color: '#555', fontWeight: 500 }}>{FIELD_LABELS[key] ?? key}</td>
            <td style={{ ...td, background: '#fff8f8' }}>{renderDiffCell(before[key], after[key], 'before')}</td>
            <td style={{ ...td, background: '#f8fff8' }}>{renderDiffCell(after[key], before[key], 'after')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── parse ────────────────────────────────────────────────────────

type StructuredDetail = {
  summary?: string
  fields?: Record<string, unknown>
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

type ParsedDetail =
  | { kind: 'structured'; detail: StructuredDetail }
  | { kind: 'text'; content: string }

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function normalizeStructuredDetail(obj: Record<string, unknown>): StructuredDetail | null {
  const source = isRecord(obj.detail) ? obj.detail : obj
  const detail: StructuredDetail = {}
  if (typeof source.summary === 'string') detail.summary = source.summary
  if (isRecord(source.fields)) detail.fields = source.fields
  if (isRecord(source.before)) detail.before = source.before
  if (isRecord(source.after)) detail.after = source.after
  return detail.summary || detail.fields || detail.before || detail.after ? detail : null
}

function parseDetail(raw: string): ParsedDetail {
  try {
    const first = JSON.parse(raw)
    const obj = typeof first === 'string' ? JSON.parse(first) : first
    if (isRecord(obj)) {
      const detail = normalizeStructuredDetail(obj)
      if (detail) return { kind: 'structured', detail }
    }
  } catch {}
  return { kind: 'text', content: raw }
}

function fallbackDetail(entry: AuditLogEntry): string {
  const parts: string[] = []
  if (entry.action) parts.push(entry.action)
  if (entry.resource_type) parts.push(RESOURCE_LABELS[entry.resource_type] ?? entry.resource_type)
  if (entry.resource_name) parts.push(entry.resource_name)
  if (entry.ip) parts.push(`ip=${entry.ip}`)
  return parts.join(' · ') || '暂无详情'
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 10, alignItems: 'start' }}>
      <Text style={{ ...mutedText, fontSize: 12 }}>{label}</Text>
      <div style={{ minWidth: 0, wordBreak: 'break-word', fontSize: 13 }}>{value || emptyValue}</div>
    </div>
  )
}

// ── popover content ──────────────────────────────────────────────

function DetailBody({ entry, parsed }: { entry: AuditLogEntry; parsed: ParsedDetail }) {
  if (parsed.kind === 'text' && entry.action === 'update') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <Text type="secondary">该 update 日志没有变更明细。请确认后端已重启，并重新执行一次更新操作。</Text>
        {parsed.content && parsed.content !== fallbackDetail(entry) && (
          <div style={{
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontSize: 13, lineHeight: 1.7, maxHeight: 240, overflowY: 'auto',
          }}>
            {parsed.content}
          </div>
        )}
      </div>
    )
  }

  if (parsed.kind === 'text') {
    return (
      <div style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontSize: 13, lineHeight: 1.7, maxHeight: 320, overflowY: 'auto',
      }}>
        {parsed.content}
      </div>
    )
  }

  const { summary, fields, before, after } = parsed.detail
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {summary && <Text strong>{summary}</Text>}
      {fields && <DetailTable fields={fields} />}
      {(before || after) && <DiffTable before={before ?? {}} after={after ?? {}} />}
      {!summary && !fields && !before && !after && <Text type="secondary">暂无详情</Text>}
    </div>
  )
}

function entryUser(entry: AuditLogEntry): string {
  if (entry.username) return entry.username
  if ((entry.action === 'login' || entry.action === 'logout') && entry.resource_name) return entry.resource_name
  return ''
}

function DetailContent({ entry }: { entry: AuditLogEntry }) {
  const raw = entry.detail ?? ''
  const parsed = raw ? parseDetail(raw) : { kind: 'text', content: fallbackDetail(entry) } as ParsedDetail
  const time = entry.created_at ? new Date(entry.created_at).toLocaleString() : ''
  const resourceType = entry.resource_type ? (RESOURCE_LABELS[entry.resource_type] ?? entry.resource_type) : ''
  const username = entryUser(entry)

  return (
    <div style={{ width: 620, maxWidth: 'min(620px, 86vw)' }}>
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <InfoRow label="用户" value={username} />
        <InfoRow label="资源" value={resourceType ? `${resourceType}${entry.resource_name ? ` / ${entry.resource_name}` : ''}` : entry.resource_name} />
        <InfoRow label="IP" value={entry.ip} />
        <InfoRow label="时间" value={time} />
      </div>
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
        <DetailBody entry={entry} parsed={parsed} />
      </div>
    </div>
  )
}

// ── public component ─────────────────────────────────────────────

interface Props {
  entry: AuditLogEntry
}

export default function AuditDetailPopover({ entry }: Props) {
  const raw = entry.detail ?? ''
  const parsed = raw ? parseDetail(raw) : null
  const isDiff = parsed?.kind === 'structured' && Boolean(parsed.detail.before || parsed.detail.after)
  const isWide = isDiff || entry.action === 'update'
  const triggerLabel = entry.action === 'update' ? '查看变更' : '查看详情'

  return (
    <Popover
      trigger="hover"
      placement="left"
      overlayStyle={{ maxWidth: isWide ? 680 : 640 }}
      title={
        <Space size={6}>
          <Tag color={entry.action === 'update' ? 'blue' : 'default'} style={{ margin: 0 }}>{entry.action === 'update' ? '更新对比' : entry.action || 'audit'}</Tag>
          <Text style={{ fontSize: 13 }}>{entry.resource_name || entryUser(entry) || '—'}</Text>
        </Space>
      }
      content={<DetailContent entry={entry} />}
    >
      <span style={{ cursor: 'pointer', color: 'var(--glass-accent)', fontSize: 13 }}>
        <FileSearchOutlined style={{ marginRight: 4 }} />
        {triggerLabel}
      </span>
    </Popover>
  )
}
