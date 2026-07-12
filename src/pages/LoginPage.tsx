import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Checkbox, Divider, Form, Input, Space, Typography, message } from 'antd'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { authApi } from '../api/auth'
import { ssoApi } from '../api/sso'
import { apiError } from '../api/client'
import { useAuthStore } from '../store/auth'
import { isCustomIcon, useSystemSettingsStore } from '../store/systemSettings'
import { useAuthSettingsStore } from '../store/authSettings'
import config from '../config'
import type { SSOProviderBrief } from '../types'
import '../App.css'

const { Text, Title } = Typography

function ssoLoginUrl(providerId: number) {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const params = new URLSearchParams({
    redirect_uri: window.location.origin + '/admin',
    callback_origin: window.location.origin,
  })
  const path = `/v1/sso/login/${providerId}?${params.toString()}`
  return base ? `${base}${path}` : path
}

function BrandMark() {
  const icon = useSystemSettingsStore((s) => s.settings.corner_icon)
  return (
    <img
      className="brand-mark"
      src={isCustomIcon(icon) ? icon : 'https://i.postimg.cc/nLrDYrHW/icon.png'}
      alt=""
      aria-hidden="true"
    />
  )
}

function EyeIcon({ crossed = false }: { crossed?: boolean }) {
  return (
    <svg className="eye-icon" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M2.6 12s3.4-6 9.4-6 9.4 6 9.4 6-3.4 6-9.4 6-9.4-6-9.4-6Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path className="eye-slash" d="M4 4l16 16" />}
    </svg>
  )
}

function EyeBall({
  size = 48, pupilSize = 16, maxDistance = 10,
  eyeColor = 'white', pupilColor = '#2D2D2D',
  isBlinking = false, forceLookX, forceLookY,
}: {
  size?: number; pupilSize?: number; maxDistance?: number
  eyeColor?: string; pupilColor?: string; isBlinking?: boolean
  forceLookX?: number; forceLookY?: number
}) {
  const [tracked, setTracked] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
      const angle = Math.atan2(dy, dx)
      setTracked({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [maxDistance])

  const pos = forceLookX !== undefined && forceLookY !== undefined ? { x: forceLookX, y: forceLookY } : tracked

  return (
    <div
      ref={ref}
      className="animated-eye"
      style={{ width: `${size}px`, height: isBlinking ? '2px' : `${size}px`, backgroundColor: eyeColor }}
    >
      {!isBlinking && (
        <div
          className="animated-eye-pupil"
          style={{ width: `${pupilSize}px`, height: `${pupilSize}px`, backgroundColor: pupilColor, transform: `translate(${pos.x}px,${pos.y}px)` }}
        />
      )}
    </div>
  )
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = '#2D2D2D', forceLookX, forceLookY }: {
  size?: number; maxDistance?: number; pupilColor?: string; forceLookX?: number; forceLookY?: number
}) {
  const [tracked, setTracked] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
      const angle = Math.atan2(dy, dx)
      setTracked({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [maxDistance])

  const pos = forceLookX !== undefined && forceLookY !== undefined ? { x: forceLookX, y: forceLookY } : tracked

  return (
    <div
      ref={ref}
      className="animated-pupil"
      style={{ width: `${size}px`, height: `${size}px`, backgroundColor: pupilColor, transform: `translate(${pos.x}px,${pos.y}px)` }}
    />
  )
}

function AnimatedCharacters({ isTyping, showPassword, passwordLength }: {
  isTyping: boolean; showPassword: boolean; passwordLength: number
}) {
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)
  const [positions, setPositions] = useState({
    purple: { faceX: 0, faceY: 0, bodySkew: 0 },
    black: { faceX: 0, faceY: 0, bodySkew: 0 },
    yellow: { faceX: 0, faceY: 0, bodySkew: 0 },
    orange: { faceX: 0, faceY: 0, bodySkew: 0 },
  })
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calc = (ref: RefObject<HTMLDivElement | null>, e: MouseEvent) => {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
      const r = ref.current.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 3)
      return {
        faceX: Math.max(-15, Math.min(15, dx / 20)),
        faceY: Math.max(-10, Math.min(10, dy / 30)),
        bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
      }
    }
    const handler = (e: MouseEvent) => setPositions({
      purple: calc(purpleRef, e),
      black: calc(blackRef, e),
      yellow: calc(yellowRef, e),
      orange: calc(orangeRef, e),
    })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  useEffect(() => {
    const blink = (set: (v: boolean) => void) => {
      const t = window.setTimeout(() => {
        set(true)
        window.setTimeout(() => { set(false); blink(set) }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t1 = blink(setIsPurpleBlinking)
    const t2 = blink(setIsBlackBlinking)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const id = window.setInterval(() => {
        setIsPurplePeeking(true)
        window.setTimeout(() => setIsPurplePeeking(false), 800)
      }, 2600)
      return () => clearInterval(id)
    }
  }, [passwordLength, showPassword])

  const isHiding = passwordLength > 0 && !showPassword
  const isLooking = isTyping
  const pp = positions.purple, bp = positions.black
  const yp = positions.yellow, op = positions.orange

  return (
    <div className="characters" aria-hidden="true">
      <div ref={purpleRef} className="auth-character blue-character" style={{
        height: isTyping || isHiding ? '440px' : '400px',
        transform: passwordLength > 0 && showPassword ? 'skewX(0deg)'
          : isTyping || isHiding ? `skewX(${pp.bodySkew - 12}deg) translateX(40px)`
          : `skewX(${pp.bodySkew}deg)`,
      }}>
        <div className="auth-eye-row blue-eyes" style={{
          left: passwordLength > 0 && showPassword ? '20px' : isLooking ? '55px' : `${45 + pp.faceX}px`,
          top: passwordLength > 0 && showPassword ? '35px' : isLooking ? '65px' : `${40 + pp.faceY}px`,
        }}>
          {[0, 1].map((i) => (
            <EyeBall key={i} size={18} pupilSize={7} maxDistance={5} isBlinking={isPurpleBlinking}
              forceLookX={passwordLength > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLooking ? 3 : undefined}
              forceLookY={passwordLength > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLooking ? 4 : undefined}
            />
          ))}
        </div>
      </div>

      <div ref={blackRef} className="auth-character black-character" style={{
        transform: passwordLength > 0 && showPassword ? 'skewX(0deg)'
          : isLooking ? `skewX(${bp.bodySkew * 1.5 + 10}deg) translateX(20px)`
          : isTyping || isHiding ? `skewX(${bp.bodySkew * 1.5}deg)`
          : `skewX(${bp.bodySkew}deg)`,
      }}>
        <div className="auth-eye-row black-eyes" style={{
          left: passwordLength > 0 && showPassword ? '10px' : isLooking ? '32px' : `${26 + bp.faceX}px`,
          top: passwordLength > 0 && showPassword ? '28px' : isLooking ? '12px' : `${32 + bp.faceY}px`,
        }}>
          {[0, 1].map((i) => (
            <EyeBall key={i} size={16} pupilSize={6} maxDistance={4} isBlinking={isBlackBlinking}
              forceLookX={passwordLength > 0 && showPassword ? -4 : isLooking ? 0 : undefined}
              forceLookY={passwordLength > 0 && showPassword ? -4 : isLooking ? -4 : undefined}
            />
          ))}
        </div>
      </div>

      <div ref={orangeRef} className="auth-character orange-character" style={{
        transform: passwordLength > 0 && showPassword ? 'skewX(0deg)' : `skewX(${op.bodySkew}deg)`,
      }}>
        <div className="auth-eye-row orange-eyes" style={{
          left: passwordLength > 0 && showPassword ? '50px' : `${82 + op.faceX}px`,
          top: passwordLength > 0 && showPassword ? '85px' : `${90 + op.faceY}px`,
        }}>
          {[0, 1].map((i) => (
            <Pupil key={i}
              forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
              forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
            />
          ))}
        </div>
      </div>

      <div ref={yellowRef} className="auth-character yellow-character" style={{
        transform: passwordLength > 0 && showPassword ? 'skewX(0deg)' : `skewX(${yp.bodySkew}deg)`,
      }}>
        <div className="auth-eye-row yellow-eyes" style={{
          left: passwordLength > 0 && showPassword ? '20px' : `${52 + yp.faceX}px`,
          top: passwordLength > 0 && showPassword ? '35px' : `${40 + yp.faceY}px`,
        }}>
          {[0, 1].map((i) => (
            <Pupil key={i}
              forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
              forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
            />
          ))}
        </div>
        <div className="yellow-mouth" style={{
          left: passwordLength > 0 && showPassword ? '10px' : `${40 + yp.faceX}px`,
          top: passwordLength > 0 && showPassword ? '88px' : `${88 + yp.faceY}px`,
        }} />
      </div>
    </div>
  )
}

interface LoginValues {
  username: string
  password: string
  remember?: boolean
}

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localAuthEnabled = useAuthSettingsStore((s) => s.localAuthEnabled)

  const [form] = Form.useForm<LoginValues>()
  const [totpForm] = Form.useForm<{ totp_code: string }>()
  const [messageApi, contextHolder] = message.useMessage()
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [passwordLength, setPasswordLength] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null)
  const serviceName = useSystemSettingsStore((s) => s.settings.service_name)
  const [ssoProviders, setSsoProviders] = useState<SSOProviderBrief[]>([])
  const [ssoLoaded, setSsoLoaded] = useState(false)
  const [showLocalForm, setShowLocalForm] = useState(false)

  // LDAP goes through local form; browser-redirect = OAuth/OIDC/SAML
  const browserSSOProviders = useMemo(
    () => ssoProviders.filter((p) => ['oauth1', 'oauth2', 'oidc', 'saml1', 'saml2'].includes(p.type)),
    [ssoProviders]
  )

  // SSO-only mode: local auth disabled and browser-redirect SSO providers exist
  const ssoOnlyMode = !localAuthEnabled && browserSSOProviders.length > 0
  // Auto-redirect when exactly one SSO provider and local auth is disabled
  const autoRedirecting = ssoOnlyMode && browserSSOProviders.length === 1 && !showLocalForm

  // Show local form when: local auth enabled, user explicitly requested it, or no SSO at all
  const displayLocalForm = !ssoOnlyMode || showLocalForm

  useEffect(() => {
    ssoApi.listPublic().then((providers) => {
      setSsoProviders(providers)
      setSsoLoaded(true)
    }).catch(() => { setSsoLoaded(true) })
  }, [])

  // Auto-redirect to single SSO when local auth is disabled
  useEffect(() => {
    if (!ssoLoaded || showLocalForm || localAuthEnabled) return
    if (browserSSOProviders.length === 1) {
      window.location.href = ssoLoginUrl(browserSSOProviders[0].id)
    }
  }, [ssoLoaded, showLocalForm, localAuthEnabled, browserSSOProviders])

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin'

  // Already logged in → redirect
  useEffect(() => {
    if (isAuthenticated()) navigate(from, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show disabled notification if redirected here after account was disabled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'disabled') {
      messageApi.error(t('login.error.disabled'), 6)
      window.history.replaceState(null, '', '/login')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (values: LoginValues) => {
    setSubmitting(true)
    try {
      const reply = await authApi.login(values.username, values.password)
      if (reply.requires_2fa) {
        setPreAuthToken(reply.pre_auth_token)
        return
      }
      setAuth(reply.token, reply.user)
      if (reply.must_change_password) {
        navigate('/setup', {
          replace: true,
          state: { initialPassword: reply.initial_password },
        })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const reason = err.response.data?.reason === 'USER_DISABLED' ? '?reason=disabled' : ''
        navigate(`/403${reason}`, { replace: true })
      } else {
        messageApi.error(apiError(err) || t('login.error.failed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleTOTPVerify = async (values: { totp_code: string }) => {
    if (!preAuthToken) return
    setSubmitting(true)
    try {
      const reply = await authApi.verifyTOTP(preAuthToken, values.totp_code)
      setAuth(reply.token, reply.user)
      navigate(from, { replace: true })
    } catch (err) {
      messageApi.error(apiError(err) || t('twoFactor.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  const ssoButtons = (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      {browserSSOProviders.map((p) => (
        <Button
          key={p.id}
          block
          style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => {
            window.location.href = ssoLoginUrl(p.id)
          }}
        >
          {p.icon && <span>{p.icon}</span>}
          {t('sso.loginWith', { name: p.name })}
        </Button>
      ))}
    </Space>
  )

  return (
    <>
      {contextHolder}
      <main className="login-page">
        <div className="bg-orb orb-1" aria-hidden="true" />
        <div className="bg-orb orb-2" aria-hidden="true" />
        <div className="bg-orb orb-3" aria-hidden="true" />

        <section className="brand-panel">
          <a className="brand-link" href="/" aria-label={`${serviceName} home`}>
            <BrandMark />
            <span>{serviceName}</span>
          </a>

          <div className="visual-stage">
            <AnimatedCharacters
              isTyping={isTyping}
              showPassword={showPassword}
              passwordLength={passwordLength}
            />
          </div>

          <nav className="legal-links" aria-label="Legal links">
            <a href="/privacy-policy">{t('nav.dashboard')}</a>
            <a href="/terms">Terms of Service</a>
          </nav>
        </section>

        <section className="form-panel" aria-label="Login form">
          <div className="mobile-brand">
            <BrandMark />
            <span>{serviceName}</span>
          </div>

          <div className="login-box">
            <div className="login-heading">
              <Title level={1}>
                {preAuthToken ? t('twoFactor.loginTitle') : t('login.title')}
              </Title>
              <Text>
                {preAuthToken ? t('twoFactor.loginDesc') : t('login.subtitle')}
              </Text>
            </div>

            {/* TOTP verification step */}
            {preAuthToken && (
              <Form
                form={totpForm}
                layout="vertical"
                requiredMark={false}
                onFinish={handleTOTPVerify}
                className="login-form"
              >
                <Form.Item
                  name="totp_code"
                  label={t('twoFactor.verifyCode')}
                  rules={[
                    { required: true, message: t('twoFactor.error.code') },
                    { len: 6, message: t('twoFactor.error.code') },
                  ]}
                >
                  <Input
                    maxLength={6}
                    autoFocus
                    placeholder={t('twoFactor.loginPlaceholder')}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={submitting}
                  className="login-button"
                >
                  {t('twoFactor.loginButton')}
                </Button>
                <Button
                  type="link"
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => { setPreAuthToken(null); totpForm.resetFields() }}
                >
                  {t('common.cancel')}
                </Button>
              </Form>
            )}

            {/* Auto-redirecting: single SSO, local auth disabled */}
            {!preAuthToken && autoRedirecting && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Text style={{ color: 'var(--glass-text-secondary)' }}>
                  {t('sso.redirecting', { name: browserSSOProviders[0].name })}
                </Text>
              </div>
            )}

            {/* SSO-only multi-provider: show SSO buttons prominently, no local form */}
            {!preAuthToken && ssoOnlyMode && !showLocalForm && !autoRedirecting && (
              <>{ssoButtons}</>
            )}

            {/* Local auth form */}
            {!preAuthToken && displayLocalForm && (
              <>
                <Form
                  form={form}
                  layout="vertical"
                  requiredMark={false}
                  initialValues={{ remember: false }}
                  onFinish={handleLogin}
                  className="login-form"
                >
                  <Form.Item
                    label={t('login.username')}
                    name="username"
                    rules={[{ required: true, message: t('login.error.username') }]}
                  >
                    <Input
                      autoComplete="username"
                      placeholder={t('login.usernamePlaceholder')}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                    />
                  </Form.Item>

                  <Form.Item
                    label={t('login.password')}
                    name="password"
                    rules={[
                      { required: true, message: t('login.error.password') },
                      { min: 6, message: t('login.error.passwordMin') },
                    ]}
                  >
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('login.passwordPlaceholder')}
                      onChange={(e) => setPasswordLength(e.target.value.length)}
                      suffix={
                        <button
                          className="password-toggle"
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          <EyeIcon crossed={showPassword} />
                        </button>
                      }
                    />
                  </Form.Item>

                  <div className="form-row">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>{t('login.remember')}</Checkbox>
                    </Form.Item>
                    <a href="/forgot-password">{t('login.forgot')}</a>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={submitting}
                    className="login-button"
                  >
                    {t('login.button')}
                  </Button>
                </Form>

                {browserSSOProviders.length === 0 && (
                  <Space className="signup-row" size={4}>
                    <Text>{t('login.noAccount')}</Text>
                    <a href="/signup">{t('login.signUp')}</a>
                  </Space>
                )}

                {/* SSO buttons below local form (when local auth is enabled) */}
                {!ssoOnlyMode && browserSSOProviders.length > 0 && (
                  <>
                    <Divider style={{ margin: '20px 0 16px', borderColor: 'var(--glass-border)' }}>
                      <Text style={{ fontSize: 12, color: 'var(--glass-text-secondary)' }}>{t('sso.orLoginWith')}</Text>
                    </Divider>
                    {ssoButtons}
                  </>
                )}

                {/* Back to SSO link when admin switched to local form in SSO-only mode */}
                {ssoOnlyMode && showLocalForm && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button type="link" size="small" onClick={() => setShowLocalForm(false)}>
                      {t('sso.backToSSO')}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Admin emergency login link shown in SSO-only mode */}
            {!preAuthToken && ssoOnlyMode && !showLocalForm && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Button
                  type="link"
                  size="small"
                  style={{ color: 'var(--glass-text-secondary)', fontSize: 12 }}
                  onClick={() => setShowLocalForm(true)}
                >
                  {t('login.adminFallback')}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
