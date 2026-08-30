import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getHHError, hhApi, isUnauthorized, type HhOtpType } from '../../api/hh'
import { profileApi } from '../../api/profile'
import { Brand } from '../../components/Brand'
import { AccountMenu } from '../../components/AccountMenu/AccountMenu'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import './ConnectHHPage.css'
import './HHStates.css'

type Step = 'phone' | 'code' | 'captcha' | 'connected'

export function ConnectHHPage() {
  const [step, setStep] = useState<Step>('phone')
  const [username, setUsername] = useState('')
  const [otpType, setOtpType] = useState<HhOtpType>('phone')
  const [code, setCode] = useState('')
  const [captchaText, setCaptchaText] = useState('')
  const [codeLength, setCodeLength] = useState(4)
  const [notice, setNotice] = useState('')
  const { connectHH, disconnectHH, logout, user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleUnauthorized = useCallback((error: unknown) => {
    if (!isUnauthorized(error)) return false
    logout()
    navigate('/login', { replace: true })
    return true
  }, [logout, navigate])

  const status = useQuery({
    queryKey: ['hh-auth-status'],
    queryFn: hhApi.getStatus,
    retry: false,
  })

  const captcha = useQuery({
    queryKey: ['hh-auth-captcha', username],
    queryFn: hhApi.getCaptcha,
    enabled: step === 'captcha',
    retry: false,
  })

  useEffect(() => {
    if (!status.data) return
    if (status.data.connected) {
      connectHH()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('connected')
    } else {
      disconnectHH()
      setStep('phone')
    }
  }, [status.data, connectHH, disconnectHH])

  useEffect(() => {
    if (status.error) handleUnauthorized(status.error)
  }, [status.error, handleUnauthorized])

  useEffect(() => {
    if (captcha.error) handleUnauthorized(captcha.error)
  }, [captcha.error, handleUnauthorized])

  const request = useMutation({
    mutationFn: () => hhApi.requestOtp(username, otpType),
    onSuccess: (result) => {
      if (result.status === 'captcha_required') {
        setCaptchaText('')
        setStep('captcha')
        setNotice('')
        return
      }
      setCodeLength(result.codeLength || 4)
      setCode('')
      setNotice('Код отправлен')
      setStep('code')
    },
    onError: handleUnauthorized,
  })

  const submitCaptcha = useMutation({
    mutationFn: () => hhApi.submitCaptcha(captchaText),
    onSuccess: (result) => {
      if (result.status === 'captcha_required') {
        setCaptchaText('')
        setNotice('Неверное значение. Попробуйте ещё раз')
        void captcha.refetch()
        return
      }
      setCodeLength(result.codeLength || 4)
      setCode('')
      setCaptchaText('')
      setNotice('CAPTCHA пройдена, код отправлен')
      setStep('code')
    },
    onError: handleUnauthorized,
  })

  const verify = useMutation({
    mutationFn: async () => {
      const result = await hhApi.verifyOtp(username, code)
      if (!result.success || !result.connected) throw new Error('Неверный или просроченный SMS-код')
      return result
    },
    onSuccess: async () => {
      connectHH()
      queryClient.removeQueries({ queryKey: ['profile'] })
      try {
        const resumes = await profileApi.getResumes()
        const primaryResume = resumes[0]
        if (primaryResume) {
          const profile = await profileApi.selectResume(primaryResume.id)
          queryClient.setQueryData(['profile'], profile)
        }
      } catch {
        // The connection succeeded even if HH temporarily did not return a resume.
      }
      setNotice('')
      setStep('connected')
    },
    onError: handleUnauthorized,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'phone') request.mutate()
    if (step === 'code') verify.mutate()
    if (step === 'captcha') submitCaptcha.mutate()
  }

  const resetForm = async () => {
    try {
      await hhApi.disconnect()
    } finally {
      disconnectHH()
      request.reset()
      verify.reset()
      submitCaptcha.reset()
      setStep('phone')
      setUsername('')
      setOtpType('phone')
      setCode('')
      setCaptchaText('')
      setNotice('')
    }
  }

  const leaveSystem = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (status.isPending) {
    return <main className="connect-page"><header><Brand /><AccountMenu email={user?.email} label="Шаг 2 из 2" onLeaveHH={resetForm} onLogout={leaveSystem} /></header><section className="connect-wrap hh-loading"><span className="spinner" /><p>Проверяем подключение HH.ru…</p></section></main>
  }

  const title = step === 'phone' ? 'Подключите HH.ru' : step === 'code' ? 'Введите код' : step === 'captcha' ? 'Требуется проверка' : 'HH.ru подключён'
  const requestError = request.error && !isUnauthorized(request.error) ? getHHError(request.error, 'request') : ''
  const verifyError = verify.error && !isUnauthorized(verify.error) ? getHHError(verify.error, 'verify') : ''
  const statusError = status.error && !isUnauthorized(status.error) ? getHHError(status.error, 'status') : ''
  const captchaError = captcha.error && !isUnauthorized(captcha.error) ? getHHError(captcha.error, 'request') : ''
  const captchaSubmitError = submitCaptcha.error && !isUnauthorized(submitCaptcha.error) ? getHHError(submitCaptcha.error, 'request') : ''

  return <main className="connect-page">
    <header><Brand /><AccountMenu email={user?.email} label="Шаг 2 из 2" onLeaveHH={resetForm} onLogout={leaveSystem} /></header>
    <section className="connect-wrap">
      <div className={'hh-icon ' + (step === 'connected' ? 'success' : step === 'captcha' ? 'captcha' : '')}>{step === 'connected' ? '✓' : step === 'captcha' ? '!' : 'hh'}</div>
      <div className="stepper"><i className="done" /><b /><i className={step !== 'phone' ? 'done' : ''} /></div>
      <p className="overline">ПОДКЛЮЧЕНИЕ АККАУНТА</p>
      <h1>{title}</h1>

      {step === 'phone' && <p className="connect-sub">Мы используем ваш аккаунт HH для поиска вакансий и отправки откликов.</p>}
      {step === 'code' && <p className="connect-sub">Мы отправили код подтверждения на <b>{username}</b></p>}
      {step === 'captcha' && <p className="connect-sub"><b>HH.ru запросил проверку CAPTCHA.</b> Введите символы с изображения вручную.</p>}
      {step === 'connected' && <p className="connect-sub">Всё готово. Теперь Focus может искать вакансии и отправлять отклики от вашего имени.</p>}

      {statusError && step === 'phone' && <div className="hh-message hh-message-error" role="alert">{statusError}</div>}
      {step === 'phone' && <form onSubmit={submit}>
        <div className="segmented" role="group" aria-label="Способ входа"><button type="button" className={otpType === 'phone' ? 'active' : ''} onClick={() => { setOtpType('phone'); setUsername(''); request.reset() }}>Телефон</button><button type="button" className={otpType === 'email' ? 'active' : ''} onClick={() => { setOtpType('email'); setUsername(''); request.reset() }}>Почта</button></div>
        <Input label={otpType === 'phone' ? 'Номер телефона' : 'Email'} placeholder={otpType === 'phone' ? '+7 911 000-00-00' : 'name@example.com'} type={otpType === 'phone' ? 'tel' : 'email'} autoComplete={otpType === 'phone' ? 'tel' : 'email'} value={username} onChange={(event) => setUsername(event.target.value)} required />
        {requestError && <div className="hh-message hh-message-error" role="alert">{requestError}</div>}
        <Button loading={request.isPending} disabled={request.isPending}>Получить код <span>→</span></Button>
      </form>}

      {step === 'code' && <form onSubmit={submit}>
        {notice && <div className="hh-message hh-message-success" role="status">✓ {notice}</div>}
        <Input label="Код подтверждения" inputMode="numeric" autoComplete="one-time-code" placeholder={'•'.repeat(codeLength)} maxLength={codeLength} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required />
        {verifyError && <div className="hh-message hh-message-error" role="alert">{verifyError}</div>}
        <button className="change-link" type="button" onClick={() => void resetForm()}>← Изменить способ входа</button>
        <Button loading={verify.isPending} disabled={verify.isPending || code.length !== codeLength}>Подтвердить <span>→</span></Button>
      </form>}

      {step === 'captcha' && <form onSubmit={submit}>
        <div className="captcha-box">
          {captcha.isPending && <span className="spinner" />}
          {captcha.data?.image && <img src={captcha.data.image} alt="CAPTCHA HH.ru" />}
        </div>
        {notice && <div className="captcha-note" role="status">{notice}</div>}
        {captchaError && <div className="hh-message hh-message-error" role="alert">{captchaError}</div>}
        {captchaSubmitError && <div className="hh-message hh-message-error" role="alert">{captchaSubmitError}</div>}
        <Input label="Символы с изображения" autoComplete="off" value={captchaText} onChange={(event) => setCaptchaText(event.target.value)} required />
        <div className="captcha-actions">
          <button className="change-link" type="button" onClick={() => void captcha.refetch()}>Обновить изображение</button>
          <button className="change-link" type="button" onClick={() => void resetForm()}>Изменить способ входа</button>
        </div>
        <Button loading={submitCaptcha.isPending} disabled={submitCaptcha.isPending || !captcha.data?.image || !captchaText.trim()}>Продолжить <span>→</span></Button>
      </form>}
      {step === 'connected' && <Button className="go-button" onClick={() => navigate('/dashboard')}>Перейти в сервис <span>→</span></Button>}
      <p className="safe-note">⌾ Ваши данные защищены и не передаются третьим лицам</p>
    </section>
  </main>
}
