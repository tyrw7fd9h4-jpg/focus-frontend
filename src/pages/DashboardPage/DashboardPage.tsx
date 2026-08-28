import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileApi, type JobSearchPreferences } from '../../api/profile'
import { SearchPreferencesPanel } from '../../components/SearchPreferences/SearchPreferencesPanel'
import { AppLayout } from '../../layouts/AppLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './DashboardPage.css'

const stats = [['Найдено вакансий', '128', '+18%', '⌕'], ['Подходящих', '42', '+12%', '◇'], ['Отправлено откликов', '24', '+8%', '↗'], ['Получено ответов', '8', '+3', '✉']]
const rows = [['Frontend Developer', 'Компания A', '180–220 тыс. ₽', 'Отклик отправлен', '12:41', 'green'], ['React Developer', 'Компания B', 'Не указана', 'На рассмотрении', '12:33', 'amber'], ['Frontend-разработчик', 'Fintech Lab', 'от 170 тыс. ₽', 'Просмотрен', 'Вчера', 'blue'], ['Middle Frontend Engineer', 'Cloud Systems', '200–250 тыс. ₽', 'Отклик отправлен', 'Вчера', 'green']] as const
const formats: Record<JobSearchPreferences['workFormat'], string> = { REMOTE_ONLY: 'Только удалённо', REMOTE_OR_HYBRID: 'Удалённо или гибрид', ANY: 'Любой' }

function SettingsSummary({ value, resumePosition }: { value: JobSearchPreferences; resumePosition: string | null | undefined }) {
  return <dl>
    <div><dt>Должность из резюме</dt><dd>{resumePosition || 'Не указана'}</dd></div>
    <div><dt>Навыки</dt><dd>{value.preferredSkills.length ? value.preferredSkills.slice(0, 3).map((skill) => <i key={skill}>{skill}</i>) : 'Не указаны'}</dd></div>
    <div><dt>Формат</dt><dd>{formats[value.workFormat]}</dd></div>
    <div><dt>Мин. зарплата</dt><dd>{value.minSalary ? new Intl.NumberFormat('ru-RU').format(value.minSalary) + ' ' + value.currency : 'Не указана'}</dd></div>
    <div><dt>География</dt><dd>{value.areas.slice(0, 2).join(', ') || 'Любая'}</dd></div>
    <div><dt>Без зарплаты</dt><dd>{value.allowSalaryNotSpecified ? 'Рассматривать' : 'Не показывать'}</dd></div>
  </dl>
}

export function DashboardPage() {
  const [running, setRunning] = useState(true)
  const [editing, setEditing] = useState(false)
  const preferences = useQuery({ queryKey: ['profile-preferences'], queryFn: profileApi.getPreferences, retry: false })
  const profile = useQuery({ queryKey: ['profile'], queryFn: profileApi.get, retry: false })
  return <AppLayout>
    <div className="dash-head"><div><p>СРЕДА, 26 АВГУСТА</p><h1>Добрый день, Александра</h1><span>Вот что происходит с вашим поиском работы.</span></div><button className="notification">♢<i>3</i></button></div>
    <Card className="search-hero"><div className="search-copy"><div className="search-icon">⌕</div><div><div className="title-line"><h2>Автопоиск вакансий</h2><Badge tone={running ? 'green' : 'neutral'}>● {running ? 'Включён' : 'Выключен'}</Badge></div><p>{running ? 'Focus ищет новые вакансии и отправляет отклики.' : 'Автопоиск приостановлен.'}</p></div></div><div className="run-info"><div><small>ПОСЛЕДНИЙ ЗАПУСК</small><b>Сегодня, 12:42</b></div><div><small>СЛЕДУЮЩИЙ ЗАПУСК</small><b>{running ? 'через 18 минут' : '—'}</b></div><div><small>НАЙДЕНО СЕГОДНЯ</small><b>24 вакансии</b></div></div><Button variant={running ? 'danger' : 'primary'} onClick={() => setRunning(!running)}>{running ? '■  Остановить' : '▶  Запустить'}</Button></Card>
    <section className="stats-grid">{stats.map(([label, value, delta, icon]) => <Card className="stat" key={label}><div><span>{icon}</span><em>{delta}</em></div><b>{value}</b><p>{label}</p></Card>)}</section>
    <section className="dashboard-grid">
      <Card className="responses"><div className="section-head"><div><h2>Последние отклики</h2><p>Актуальные статусы ваших заявок</p></div><button>Все отклики →</button></div><div className="table"><div className="tr th"><span>ВАКАНСИЯ</span><span>ЗАРПЛАТА</span><span>СТАТУС</span><span>ВРЕМЯ</span></div>{rows.map(([job, company, salary, status, time, tone]) => <div className="tr" key={job}><span><b>{job}</b><small>{company}</small></span><span>{salary}</span><span><Badge tone={tone}>{status}</Badge></span><span>{time}</span></div>)}</div></Card>
      <Card className="settings"><div className="section-head"><div><h2>Настройки поиска</h2><p>Актуальные параметры</p></div><button type="button" onClick={() => setEditing(true)}>✎</button></div>{(preferences.isPending || profile.isPending) && <div className="settings-state"><span className="spinner" /> Загружаем…</div>}{(preferences.isError || profile.isError) && <div className="settings-state error">Не удалось загрузить</div>}{preferences.data && profile.data && <SettingsSummary value={preferences.data} resumePosition={profile.data.profile?.desiredPosition} />}<Button variant="secondary" disabled={!preferences.data} onClick={() => setEditing(true)}>Изменить настройки</Button></Card>
    </section>
    {editing && preferences.data && <div className="preferences-modal" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false) }}><section className="preferences-drawer"><header><div><span>НАСТРОЙКИ АВТОПОИСКА</span><h2>Настройки поиска</h2><p>Изменения повлияют на следующий запуск Focus.</p></div><button type="button" onClick={() => setEditing(false)} aria-label="Закрыть">×</button></header><SearchPreferencesPanel initial={preferences.data} resumePosition={profile.data?.profile?.desiredPosition} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} /></section></div>}
  </AppLayout>
}
