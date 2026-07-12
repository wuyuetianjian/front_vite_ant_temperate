import { Button, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const disabled = new URLSearchParams(location.search).get('reason') === 'disabled'

  return (
    <main className="forbidden-page">
      <Result
        status="403"
        title={t('forbidden.title')}
        subTitle={disabled ? t('forbidden.disabledSubtitle') : t('forbidden.subtitle')}
        extra={
          isAuthenticated() && !disabled
            ? <Button type="primary" onClick={() => navigate('/admin', { replace: true })}>{t('forbidden.backToHome')}</Button>
            : <Button type="primary" onClick={() => navigate('/login', { replace: true })}>{t('forbidden.backToLogin')}</Button>
        }
      />
    </main>
  )
}
