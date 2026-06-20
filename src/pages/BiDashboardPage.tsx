import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Button, Dropdown } from 'antd'
import { UserOutlined, LoginOutlined, DashboardOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/auth'

// ── Fake data ──────────────────────────────────────────────────────────────
const HOURS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const baseUv = [120, 180, 140, 320, 410, 390, 520, 480, 610, 540, 700, 660]
const basePv = [80, 110, 95, 200, 280, 260, 370, 340, 430, 390, 510, 470]
const baseReq = [24, 38, 29, 55, 72, 68, 91, 84, 107, 94, 122, 115]

const regionData = [
  { name: '华东', value: 38, color: '#00d4ff' },
  { name: '华南', value: 22, color: '#7c3aed' },
  { name: '华北', value: 19, color: '#10b981' },
  { name: '西南', value: 12, color: '#f59e0b' },
  { name: '其他', value: 9, color: '#ec4899' },
]

const CATEGORIES = ['权限管理', '用户管理', '角色管理', '系统配置', '数据审计', '安全日志']
const catValues = [342, 289, 198, 156, 94, 71]

const FEED = [
  { time: '12:43:21', msg: '用户 alice 登录成功', type: 'info' },
  { time: '12:43:05', msg: '权限 system:* 授权给 Admin 角色', type: 'warn' },
  { time: '12:42:58', msg: '新用户 bob 注册完成', type: 'info' },
  { time: '12:42:30', msg: '角色 Operator 创建成功', type: 'success' },
  { time: '12:41:55', msg: '用户 carol 密码变更', type: 'warn' },
  { time: '12:41:12', msg: '权限审计日志写入完成', type: 'info' },
  { time: '12:40:48', msg: '系统启动自检通过', type: 'success' },
  { time: '12:40:10', msg: 'IP 192.168.1.42 多次登录失败', type: 'error' },
]

// ── SVG chart helpers ──────────────────────────────────────────────────────
function polyPoints(data: number[], w: number, h: number, pad = 8) {
  const max = Math.max(...data), min = Math.min(...data), range = (max - min) || 1
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = (h - pad) - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

function LineChart({ data, color, id, w = 340, h = 90 }: { data: number[]; color: string; id: string; w?: number; h?: number }) {
  const pts = polyPoints(data, w, h)
  const last = pts.split(' ').at(-1)?.split(',') ?? ['0', '0']
  const area = `${pts} ${w - 8},${h} 8,${h}`
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
    </svg>
  )
}

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const w = 320, h = 130, max = Math.max(...data), barW = 18, gap = w / data.length
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = Math.round((v / max) * (h - 28))
        const x = i * gap + (gap - barW) / 2
        return (
          <g key={i}>
            <rect x={x} y={h - bh - 18} width={barW} height={bh} rx={3}
              fill={color} opacity={0.55 + 0.45 * (v / max)} />
            <rect x={x} y={h - bh - 18} width={barW} height={3} rx={2} fill={color} />
            <text x={x + barW / 2} y={h - 3} textAnchor="middle" fill="#6b8aa8" fontSize="9">{labels[i]}</text>
            <text x={x + barW / 2} y={h - bh - 22} textAnchor="middle" fill={color} fontSize="9">{v}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ data }: { data: typeof regionData }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = 70, cy = 70, R = 58, r = 38
  let angle = -Math.PI / 2
  const slices = data.map((d) => {
    const a = (d.value / total) * Math.PI * 2
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle)
    const x2 = cx + R * Math.cos(angle + a), y2 = cy + R * Math.sin(angle + a)
    const xi1 = cx + r * Math.cos(angle), yi1 = cy + r * Math.sin(angle)
    const xi2 = cx + r * Math.cos(angle + a), yi2 = cy + r * Math.sin(angle + a)
    const lg = a > Math.PI ? 1 : 0
    const path = `M${xi1},${yi1} L${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${xi2},${yi2} A${r},${r} 0 ${lg} 0 ${xi1},${yi1} Z`
    angle += a
    return { path, color: d.color }
  })
  return (
    <svg width={140} height={140} style={{ flexShrink: 0 }}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">{total}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b8aa8" fontSize="9">覆盖率</text>
    </svg>
  )
}

function GaugeChart({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = value / max, cx = 70, cy = 75, R = 55
  const startA = Math.PI * 0.75, endA = Math.PI * 2.25
  const span = endA - startA
  const arcEnd = startA + span * pct
  const x1 = cx + R * Math.cos(startA), y1 = cy + R * Math.sin(startA)
  const x2 = cx + R * Math.cos(endA), y2 = cy + R * Math.sin(endA)
  const xv = cx + R * Math.cos(arcEnd), yv = cy + R * Math.sin(arcEnd)
  const lg = span * pct > Math.PI ? 1 : 0
  const bgArc = `M${x1},${y1} A${R},${R} 0 1 1 ${x2},${y2}`
  const valArc = `M${x1},${y1} A${R},${R} 0 ${lg} 1 ${xv},${yv}`
  return (
    <svg width={140} height={110} style={{ flexShrink: 0 }}>
      <path d={bgArc} fill="none" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" />
      <path d={valArc} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      <circle cx={xv} cy={yv} r="5" fill={color} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="700">{value}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b8aa8" fontSize="10">系统健康度</text>
    </svg>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function GlassCard({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(8, 20, 45, 0.65)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 180, 255, 0.18)',
      borderRadius: 12,
      padding: '14px 16px',
      boxShadow: '0 0 20px rgba(0, 120, 255, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', gap: 10,
      ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#00d4ff,#6366f1)', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94b8d4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

function KpiCard({ label, value, unit, delta, color, sub }: {
  label: string; value: string | number; unit?: string; delta?: string; color: string; sub?: string
}) {
  return (
    <GlassCard style={{ gap: 6 }}>
      <span style={{ fontSize: 11, color: '#6b8aa8', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: '#6b8aa8' }}>{unit}</span>}
      </div>
      {(delta || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta && <span style={{ fontSize: 11, color: delta.startsWith('+') ? '#10b981' : '#ef4444' }}>{delta}</span>}
          {sub && <span style={{ fontSize: 10, color: '#445566' }}>{sub}</span>}
        </div>
      )}
    </GlassCard>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function BiDashboardPage() {
  const { token: authToken, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [tick, setTick] = useState(0)
  const lineDataRef = useRef(baseUv.slice())

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date())
      setTick((t) => t + 1)
      lineDataRef.current = lineDataRef.current.map((v) =>
        Math.max(50, Math.min(800, v + Math.round((Math.random() - 0.48) * 30)))
      )
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  // fake KPIs that slowly increment
  const kpiUsers = 12483 + tick * 3
  const kpiOnline = 847 + (tick % 7) - 3
  const kpiReq = (38.2 + tick * 0.04).toFixed(1)
  const kpiRate = Math.min(99.9, 98.7 + tick * 0.01).toFixed(1)

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 20% 50%, #071428 0%, #030d1f 60%, #060312 100%)',
      fontFamily: '"Aptos", ui-sans-serif, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* ── Header ── */}
      <div style={{
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(3, 12, 30, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 160, 255, 0.15)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Left: clock */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 180 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
          <span style={{ fontSize: 10, color: '#445577', marginTop: -2 }}>{dateStr}</span>
        </div>

        {/* Center: title */}
        <div style={{ textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #00d4ff)' }} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 6, color: '#e2f0ff',
              textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              数据智能驾驶舱
            </span>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, #00d4ff, transparent)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 2 }}>
            {['●', '◆', '●'].map((s, i) => (
              <span key={i} style={{ fontSize: 6, color: i === 1 ? '#6366f1' : '#00d4ff', opacity: 0.7 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Right: user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 180, justifyContent: 'flex-end' }}>
          {authToken ? (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'admin',
                    icon: <DashboardOutlined />,
                    label: '进入后台',
                    onClick: () => navigate('/admin'),
                  },
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: '个人设置',
                    onClick: () => navigate('/admin/profile'),
                  },
                  {
                    key: 'password',
                    icon: <KeyOutlined />,
                    label: '修改密码',
                    onClick: () => navigate('/admin/profile'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    danger: true,
                    onClick: () => { clearAuth(); navigate('/login') },
                  },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={30} icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#a0c4e8', userSelect: 'none' }}>
                  {user?.display_name || user?.username}
                </span>
              </div>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button
                size="small"
                icon={<LoginOutlined />}
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  borderColor: 'rgba(0,212,255,0.35)',
                  color: '#00d4ff',
                  fontSize: 12,
                }}
              >
                请登录
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1, overflow: 'hidden',
        display: 'grid',
        gridTemplateRows: '100px 1fr 1fr',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 10, padding: '10px 14px',
      }}>

        {/* Row 1: KPI cards */}
        <KpiCard label="累计用户数" value={kpiUsers.toLocaleString()} delta="+3 今日" color="#00d4ff" sub="↑12.4% 较上月" />
        <KpiCard label="当前在线" value={kpiOnline} unit="人" delta={`${kpiOnline > 847 ? '+' : ''}${kpiOnline - 847}`} color="#10b981" sub="实时更新" />
        <KpiCard label="今日请求量" value={kpiReq} unit="万次" delta="+5.8%" color="#f59e0b" sub="API 调用" />
        <KpiCard label="系统可用率" value={kpiRate} unit="%" delta="+0.1%" color="#7c3aed" sub="近30天均值" />

        {/* Row 2 col 1: UV trend */}
        <GlassCard title="访问趋势 (UV/PV)" style={{ gridColumn: 1, gridRow: 2 }}>
          <LineChart data={lineDataRef.current} color="#00d4ff" id="uv" />
          <LineChart data={basePv} color="#7c3aed" id="pv" h={60} />
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {[{ c: '#00d4ff', l: 'UV' }, { c: '#7c3aed', l: 'PV' }].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 20, height: 2, background: x.c, borderRadius: 1 }} />
                <span style={{ fontSize: 10, color: '#6b8aa8' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Row 2 col 2-3: center big metric */}
        <GlassCard title="核心指标" style={{ gridColumn: '2 / 4', gridRow: 2 }}>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
            {[
              { label: '角色总数', value: 12, color: '#10b981', desc: '系统权限角色' },
              { label: '权限条目', value: 68, color: '#f59e0b', desc: '细粒度权限' },
              { label: '活跃会话', value: kpiOnline, color: '#00d4ff', desc: '并发在线' },
              { label: '今日登录', value: 284 + tick, color: '#7c3aed', desc: '成功次数' },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: 'center', padding: '8px 16px',
                background: 'rgba(0,0,0,0.25)', borderRadius: 10,
                border: `1px solid ${m.color}22` }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: m.color,
                  fontVariantNumeric: 'tabular-nums', textShadow: `0 0 16px ${m.color}66` }}>
                  {m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#94b4cc', marginTop: 2 }}>{m.label}</div>
                <div style={{ fontSize: 10, color: '#445566', marginTop: 1 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Row 2 col 4: donut */}
        <GlassCard title="地区分布" style={{ gridColumn: 4, gridRow: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DonutChart data={regionData} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {regionData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#8aaabb', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Row 3 col 1: API requests bar */}
        <GlassCard title="API 请求量 / 月" style={{ gridColumn: 1, gridRow: 3 }}>
          <BarChart data={baseReq} labels={MONTHS.slice(0, 12)} color="#00d4ff" />
        </GlassCard>

        {/* Row 3 col 2: category bar */}
        <GlassCard title="功能模块调用" style={{ gridColumn: 2, gridRow: 3 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            {CATEGORIES.map((c, i) => {
              const pct = Math.round((catValues[i] / catValues[0]) * 100)
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#6b8aa8', width: 56, textAlign: 'right', flexShrink: 0 }}>{c}</span>
                  <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 5,
                      background: `linear-gradient(90deg, #6366f1, #00d4ff)`,
                      boxShadow: '0 0 6px rgba(0,212,255,0.4)',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#00d4ff', width: 28, flexShrink: 0 }}>{catValues[i]}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Row 3 col 3: activity feed */}
        <GlassCard title="实时事件流" style={{ gridColumn: 3, gridRow: 3 }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {FEED.map((f, i) => {
              const dot = { info: '#00d4ff', warn: '#f59e0b', success: '#10b981', error: '#ef4444' }[f.type] ?? '#888'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 1 - i * 0.08 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#445566', flexShrink: 0 }}>{f.time}</span>
                  <span style={{ fontSize: 10, color: '#8aabb8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.msg}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Row 3 col 4: gauge */}
        <GlassCard title="系统状态" style={{ gridColumn: 4, gridRow: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <GaugeChart value={Math.min(99, 94 + (tick % 5))} color="#10b981" />
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'CPU', value: `${32 + (tick % 8)}%`, color: '#00d4ff' },
                { label: 'MEM', value: `${61 + (tick % 4)}%`, color: '#7c3aed' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#445566' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
