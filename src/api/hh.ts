import axios from 'axios'
import { api } from './api'

export type HHStatusResponse = { connected: boolean }
export type OTPRequestResponse =
  | { status: 'otp_sent'; codeLength: number }
  | { status: 'captcha_required' }
export type OTPVerifyResponse = { success: boolean; connected: boolean }
export type CaptchaResponse = { image: string }
export type HhOtpType = 'phone' | 'email'

export const hhApi = {
  getStatus: () => api.get<HHStatusResponse>('/hh/auth/status').then(({ data }) => data),
  disconnect: () =>
    api.post<{ success: boolean; connected: false }>('/hh/auth/disconnect').then(({ data }) => data),
  requestOtp: (username: string, otpType: HhOtpType) =>
    api.post<OTPRequestResponse>('/hh/auth/otp/request', { username, otpType }, { timeout: 60_000 }).then(({ data }) => data),
  getCaptcha: () =>
    api.get<CaptchaResponse>('/hh/auth/captcha', { timeout: 60_000 }).then(({ data }) => data),
  submitCaptcha: (captchaText: string) =>
    api.post<OTPRequestResponse>('/hh/auth/captcha/submit', { captchaText }, { timeout: 60_000 }).then(({ data }) => data),
  verifyOtp: (username: string, code: string) =>
    api.post<OTPVerifyResponse>('/hh/auth/otp/verify', { username, code }, { timeout: 60_000 }).then(({ data }) => data),
}

export function getHHError(error: unknown, action: 'request' | 'verify' | 'status') {
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message
  if (!axios.isAxiosError(error)) return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
  if (!error.response) return 'Нет соединения с сервером. Проверьте подключение и попробуйте снова.'
  const message = error.response.data?.message
  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string') return message
  if (error.response.status === 401) return 'Сессия истекла. Войдите в аккаунт снова.'
  if (action === 'verify' && (error.response.status === 400 || error.response.status === 422)) return 'Неверный или просроченный SMS-код'
  if (error.response.status >= 500) return 'Сервис временно недоступен. Попробуйте позже.'
  if (action === 'request') return 'Не удалось отправить код. Проверьте номер телефона.'
  if (action === 'verify') return 'Не удалось проверить SMS-код.'
  return 'Не удалось проверить подключение HH.ru.'
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}
