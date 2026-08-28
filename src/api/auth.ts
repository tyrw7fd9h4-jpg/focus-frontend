import axios from 'axios'
import { api } from './api'

export type User = {
  id: string | number
  email: string
  name?: string
}

type Credentials = { email: string; password: string }
type AuthResponse = { accessToken: string; user?: User }

export const authApi = {
  register: (credentials: Credentials) =>
    api.post<AuthResponse>('/auth/register', credentials).then(({ data }) => data),
  login: (credentials: Credentials) =>
    api.post<AuthResponse>('/auth/login', credentials).then(({ data }) => data),
  me: () => api.get<User>('/auth/me').then(({ data }) => data),
}

export function getAuthError(error: unknown, mode: 'login' | 'register') {
  if (!axios.isAxiosError(error)) return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
  if (!error.response) return 'Нет соединения с сервером. Проверьте подключение и попробуйте снова.'

  const message = error.response.data?.message
  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string') return message
  if (error.response.status === 401) return 'Неверный email или пароль'
  if (error.response.status === 409 && mode === 'register') return 'Пользователь с таким email уже существует'
  if (error.response.status >= 500) return 'Сервер временно недоступен. Попробуйте позже.'
  return mode === 'login' ? 'Не удалось войти. Проверьте введённые данные.' : 'Не удалось создать аккаунт.'
}
