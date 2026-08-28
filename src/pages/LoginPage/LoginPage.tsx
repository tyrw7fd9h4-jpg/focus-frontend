import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { getAuthError } from '../../api/auth'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import './LoginPage.css'
import './LoginErrors.css'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const { login, register, isAuthenticated, isHHConnected } = useAuthStore()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => isRegister ? register(email, password) : login(email, password),
    onSuccess: () => navigate('/connect-hh'),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setValidationError('')
    if (isRegister && password !== repeatPassword) {
      setValidationError('Пароли не совпадают')
      return
    }
    mutation.mutate()
  }

  const switchMode = () => {
    setIsRegister((value) => !value)
    setValidationError('')
    mutation.reset()
  }

  if (isAuthenticated) return <Navigate to={isHHConnected ? '/dashboard' : '/connect-hh'} replace />

  const requestError = mutation.error ? getAuthError(mutation.error, isRegister ? 'register' : 'login') : ''

  return <main className="auth-page">
    <section className="auth-aside">
      <Brand light />
      <div className="aside-copy"><span className="eyebrow">ВАШ AI-РЕКРУТЕР</span><h2>Работа найдёт<br />вас сама.</h2><p>Focus ищет подходящие вакансии и отправляет отклики, пока вы заняты важным.</p></div>
      <div className="aside-activity"><span className="pulse-dot" /><div><b>Автопоиск работает</b><small>24 вакансии проверено сегодня</small></div></div>
    </section>
    <section className="auth-main"><div className="auth-box">
      <div className="mobile-brand"><Brand /></div>
      <p className="overline">ДОБРО ПОЖАЛОВАТЬ</p>
      <h1>{isRegister ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</h1>
      <p className="auth-subtitle">{isRegister ? 'Начните поиск работы на автопилоте.' : 'Продолжите поиск работы на автопилоте.'}</p>
      <form onSubmit={submit}>
        <Input label="Email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Пароль" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Минимум 8  символов" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {isRegister && <Input label="Повторите пароль" type="password" autoComplete="new-password" placeholder="Введите пароль ещё раз" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} required error={validationError || undefined} />}
        {requestError && <div className="form-error" role="alert">{requestError}</div>}
        <Button type="submit" loading={mutation.isPending} disabled={mutation.isPending}>{isRegister ? 'Создать аккаунт' : 'Войти'} <span>→</span></Button>
      </form>
      <p className="auth-switch">{isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <button type="button" onClick={switchMode}>{isRegister ? 'Войти' : 'Создать аккаунт'}</button></p>
      <p className="legal">Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности.</p>
    </div></section>
  </main>
}
