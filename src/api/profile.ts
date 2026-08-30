import axios from 'axios'
import { api } from './api'

export type ExperienceItem = {
  company: string | null
  position: string | null
  period: string | null
  description: string | null
  rawText: string
}

export type EducationItem = {
  institution: string | null
  details: string | null
  rawText: string
}

export type Profile = {
  id: number
  hhUserId: string | null
  hhResumeId: string | null
  firstName: string | null
  lastName: string | null
  desiredPosition: string | null
  specializations: string[]
  skills: string[]
  experience: ExperienceItem[] | null
  totalExperienceMonths: number | null
  salaryAmount: number | null
  salaryCurrency: string | null
  area: string | null
  education: EducationItem[] | null
  languages: string[] | null
  employment: string[]
  schedule: string[]
  lastSyncedAt: string | null
}

export type ProfileResponse = {
  connected: boolean
  profile: Profile | null
}

export type HhResume = {
  id: string
  title: string
}

export type JobSearchPreferences = {
  id: number
  desiredPositions: string[]
  desiredSpecializations: string[]
  preferredSkills: string[]
  allowedSkills: string[]
  excludedSkills: string[]
  minGrade: string | null
  maxGrade: string | null
  allowRelatedRoles: boolean
  workFormat: 'REMOTE_ONLY' | 'REMOTE_OR_HYBRID' | 'ANY'
  minSalary: number | null
  currency: string
  allowSalaryNotSpecified: boolean
  areas: string[]
  allowOtherAreas: boolean
  employmentTypes: string[]
  accreditedCompanyPreference: 'ONLY_ACCREDITED' | 'EXCLUDE_ACCREDITED' | 'ANY'
  stopWords: string[]
  excludedCompanies: string[]
  autoSearchEnabled: boolean
  autoApplyEnabled: boolean
  updatedAt: string
}

export type PreferencesPayload = Omit<JobSearchPreferences, 'id' | 'updatedAt'>

export const profileApi = {
  get: () => api.get<ProfileResponse>('/profile').then(({ data }) => data),
  getResumes: () =>
    api.get<HhResume[]>('/hh/resumes', { timeout: 30_000 }).then(({ data }) => data),
  selectResume: (hhResumeId: string) =>
    api.put<ProfileResponse>('/profile/resume', { hhResumeId }, { timeout: 45_000 }).then(({ data }) => data),
  syncHh: () =>
    api.post<ProfileResponse>('/profile/sync-hh', undefined, { timeout: 45_000 }).then(({ data }) => data),
  getPreferences: () =>
    api.get<JobSearchPreferences>('/profile/preferences').then(({ data }) => data),
  updatePreferences: (preferences: Partial<PreferencesPayload>) =>
    api.put<JobSearchPreferences>('/profile/preferences', preferences).then(({ data }) => data),
}

export function getProfileError(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
  if (!error.response) return 'Нет соединения с сервером.'
  const message = error.response.data?.message
  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string') return message
  if (error.response.status === 401) return 'Сессия истекла. Войдите снова.'
  return 'Не удалось сохранить данные. Попробуйте позже.'
}
