import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../layouts/AppLayout'
import {
  getProfileError,
  profileApi,
  type Profile,
} from '../../api/profile'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './ProfilePage.css'

function formatExperience(months: number | null) {
  if (!months) return 'Не указан'
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [years ? years + ' г.' : '', rest ? rest + ' мес.' : ''].filter(Boolean).join(' ')
}

function formatDate(value: string | null) {
  if (!value) return 'Ещё не синхронизировано'
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function money(amount: number | null, currency: string | null) {
  if (!amount) return 'Не указана'
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + (currency ?? '')
}

function cleanHHDescription(value: string | null) {
  if (!value) return null

  const cleaned = value
    .replace(/(^|\n)\s*(?:Развернуть|Свернуть)\s*(?=\n|$)/gi, '$1')
    .replace(/\s+(?:Развернуть|Свернуть)\s*$/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned || null
}

function HhProfileBlock({ profile }: { profile: Profile | null }) {
  const queryClient = useQueryClient()
  const resumes = useQuery({ queryKey: ['hh-resumes'], queryFn: profileApi.getResumes, retry: false })
  const [resumeId, setResumeId] = useState(profile?.hhResumeId ?? '')
  const selectResume = useMutation({
    mutationFn: () => profileApi.selectResume(resumeId),
    onSuccess: (data) => queryClient.setQueryData(['profile'], data),
  })
  const sync = useMutation({
    mutationFn: profileApi.syncHh,
    onSuccess: (data) => queryClient.setQueryData(['profile'], data),
  })
  const activeMutation = selectResume.isPending || sync.isPending
  const error = selectResume.error ?? sync.error ?? resumes.error

  return <Card className="profile-card hh-profile-card">
    <div className="profile-card-head">
      <div>
        <span className="section-kicker">ДАННЫЕ КАНДИДАТА</span>
        <h2>Профиль HH</h2>
        <p>Информация автоматически синхронизируется из выбранного резюме.</p>
      </div>
      <span className="connected-pill"><i /> HH.ru подключён</span>
    </div>

    <div className="resume-picker">
      <label>
        <span>Основное резюме</span>
        <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} disabled={resumes.isPending || activeMutation}>
          <option value="">{resumes.isPending ? 'Загружаем резюме…' : 'Выберите резюме'}</option>
          {resumes.data?.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
        </select>
      </label>
      {resumeId !== profile?.hhResumeId
        ? <Button loading={selectResume.isPending} disabled={!resumeId || activeMutation} onClick={() => selectResume.mutate()}>Выбрать и загрузить</Button>
        : <Button variant="secondary" loading={sync.isPending} disabled={!profile?.hhResumeId || activeMutation} onClick={() => sync.mutate()}>↻ Обновить данные из HH</Button>}
    </div>

    {error && <div className="profile-message error" role="alert">{getProfileError(error)}</div>}
    {(selectResume.isSuccess || sync.isSuccess) && <div className="profile-message success" role="status">✓ Данные HH обновлены</div>}

    {!profile?.lastSyncedAt && <div className="empty-profile">
      <b>Выберите основное резюме</b>
      <p>Focus загрузит опыт, навыки и остальные данные кандидата автоматически.</p>
    </div>}

    {profile?.lastSyncedAt && <>
      <div className="candidate-summary">
        <div className="candidate-avatar">{(profile.firstName?.[0] ?? 'F') + (profile.lastName?.[0] ?? '')}</div>
        <div>
          <h3>{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Кандидат HH'}</h3>
          <p>{profile.desiredPosition || 'Желаемая должность не указана'}</p>
        </div>
        <small>Обновлено: {formatDate(profile.lastSyncedAt)}</small>
      </div>
      <div className="candidate-grid">
        <div><span>Общий опыт</span><b>{formatExperience(profile.totalExperienceMonths)}</b></div>
        <div><span>Зарплата в резюме</span><b>{money(profile.salaryAmount, profile.salaryCurrency)}</b></div>
        <div><span>Город</span><b>{profile.area || 'Не указан'}</b></div>
        <div><span>Формат и занятость</span><b>{[...profile.schedule, ...profile.employment].join(', ') || 'Не указаны'}</b></div>
      </div>
      <div className="profile-data-section">
        <h3>Навыки</h3>
        <div className="read-tags">{profile.skills.length ? profile.skills.map((skill) => <span key={skill}>{skill}</span>) : <em>Не указаны</em>}</div>
      </div>
      {!!profile.experience?.length && <div className="profile-data-section">
        <h3>Опыт работы</h3>
        <div className="experience-list">{profile.experience.map((item, index) => {
          const description = cleanHHDescription(item.description)
          return <article key={item.rawText + index}><i /><div><b>{item.position || item.company || 'Место работы'}</b>{item.position && item.company && <span>{item.company}</span>}<small>{item.period}</small>{description && <p>{description}</p>}</div></article>
        })}</div>
      </div>}
      {!!profile.education?.length && <div className="profile-data-section">
        <h3>Образование</h3>
        {profile.education.map((item, index) => <div className="education-row" key={item.rawText + index}><b>{item.institution}</b><span>{item.details}</span></div>)}
      </div>}
    </>}
  </Card>
}

export function ProfilePage() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: profileApi.get, retry: false })
  const loading = profile.isPending
  const error = profile.error

  return <AppLayout>
    <div className="profile-page">
      <header className="profile-page-head"><div><p>ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ</p><h1>Резюме HH</h1><span>Данные резюме, которое Focus использует для поиска вакансий.</span></div></header>
      {loading && <div className="profile-page-state"><span className="spinner" /> Загружаем профиль…</div>}
      {error && <div className="profile-page-state error">{getProfileError(error)}</div>}
      {profile.data && <HhProfileBlock key={profile.data.profile?.hhResumeId ?? 'empty'} profile={profile.data.profile} />}
    </div>
  </AppLayout>
}
