import { useEffect, useState } from 'react'
import {
  Button, Select, Space, Table, Typography, type TableProps,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { auditLogsApi } from '../../api/auditLogs'
import config from '../../config'
import type { AuditLogEntry } from '../../types'

const ACTION_OPTIONS = ['login', 'create', 'update', 'delete', 'kick']

export default function AuditLogsPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filterAction, setFilterAction] = useState<string | undefined>(undefined)

  const pageSize = config.defaultPageSize

  const load = async (p = page, action = filterAction) => {
    setLoading(true)
    try {
      const res = await auditLogsApi.list({ page_size: pageSize, page_token: (p - 1) * pageSize, action })
      setLogs(res.logs ?? [])
      setTotal(res.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const handleActionChange = (value: string | undefined) => {
    setFilterAction(value)
    setPage(1)
    load(1, value)
  }

  const columns: TableProps<AuditLogEntry>['columns'] = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('auditLogs.user'), dataIndex: 'username', ellipsis: true },
    { title: t('auditLogs.action'), dataIndex: 'action', width: 100 },
    { title: t('auditLogs.resourceType'), dataIndex: 'resource_type', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: t('auditLogs.resourceName'), dataIndex: 'resource_name', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: t('auditLogs.ip'), dataIndex: 'ip', ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: t('auditLogs.time'),
      dataIndex: 'created_at',
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : '—',
    },
    {
      title: t('auditLogs.detail'),
      dataIndex: 'detail',
      ellipsis: true,
      render: (v) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('auditLogs.title')}</Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder={t('auditLogs.filterAction')}
            style={{ width: 160 }}
            value={filterAction}
            onChange={handleActionChange}
            options={[
              { value: undefined, label: t('auditLogs.allActions') },
              ...ACTION_OPTIONS.map((a) => ({ value: a, label: a })),
            ]}
          />
          <Button onClick={() => load()}>{t('common.search')}</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (n) => t('common.total', { count: n }) }}
        bordered={false}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
