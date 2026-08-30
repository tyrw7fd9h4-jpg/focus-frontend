import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { vacanciesApi, type VacancyStatus } from '../api/vacancies'
import { profileApi } from '../api/profile'
import { VacancyCard } from '../components/VacancyCard/VacancyCard'
import { AppLayout } from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import './VacanciesPage.css'
import './CoverLetterModal.css'

type Filter = 'all' | 'suitable' | 'favorites'

function errorText(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Не удалось выполнить запрос'
}

export function VacanciesPage() {
  const client = useQueryClient()
  const [params, setParams] = useSearchParams()
  const initial = params.get('match') === 'suitable' ? 'suitable' : 'all'
  const [filter, setFilterState] = useState<Filter>(initial)
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const profile = useQuery({ queryKey: ['profile'], queryFn: profileApi.get, retry: false })
  const query = useQuery({
    queryKey: ['vacancies', filter, page],
    queryFn: () => vacanciesApi.list({
      match: filter === 'suitable' ? 'suitable' : 'all',
      status: filter === 'favorites' ? 'FAVORITE' : 'ACTIVE',
      page,
    }),
    retry: false,
  })
  const search = useMutation({
    mutationFn: vacanciesApi.search,
    onSuccess: async () => {
      setPage(1)
      await client.invalidateQueries({ queryKey: ['vacancies'] })
      await client.invalidateQueries({ queryKey: ['vacancy-summary'] })
    },
  })
  const status = useMutation({
    mutationFn: ({ id, value }: { id: number; value: VacancyStatus }) => vacanciesApi.updateStatus(id, value),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['vacancies'] })
      await client.invalidateQueries({ queryKey: ['vacancy-summary'] })
    },
  })
  const generateLetter = useMutation({
    mutationFn: ({ resumeId, vacancyId }: { resumeId: number; vacancyId: number }) => vacanciesApi.generateCoverLetter(resumeId, vacancyId),
    onSuccess: ({ text }) => setCoverLetter(text),
  })
  const respond = (vacancyId: number) => {
    const resumeId = profile.data?.profile?.id
    if (!resumeId) {
      setActionError('Сначала подключите и синхронизируйте резюме в профиле.')
      return
    }
    setActionError(null)
    generateLetter.mutate({ resumeId, vacancyId })
  }
  const setFilter = (value: Filter) => {
    setFilterState(value)
    setPage(1)
    setParams(value === 'suitable' ? { match: 'suitable' } : {})
  }
  const totalPages = query.data ? Math.ceil(query.data.total / query.data.limit) : 1

  return <AppLayout>
    <div className="vacancies-head">
      <div><p>ПОИСК ПО НАСТРОЙКАМ ПРОФИЛЯ</p><h1>Вакансии</h1><span>Здесь нет вакансий, на которые вы уже откликались через HH.</span></div>
      <Button loading={search.isPending} onClick={() => search.mutate()}>Обновить</Button>
    </div>
    {(actionError || search.isError || generateLetter.isError) && <div className="vacancy-search-error" role="alert">{generateLetter.isError ? errorText(generateLetter.error) : search.isError ? errorText(search.error) : actionError}</div>}
    <section className="vacancy-summary">
      <div><b>{query.data?.summary.total ?? '—'}</b><span>Найдено</span></div>
      <div><b>{query.data?.summary.favorites ?? '—'}</b><span>В избранном</span></div>
      <div><b>{query.data?.summary.state?.respondedCount ?? '—'}</b><span>Исключено откликов HH</span></div>
    </section>
    <div className="vacancy-toolbar">
      <div>{([['all', 'Все'], ['suitable', 'Подходящие'], ['favorites', 'Избранные']] as const).map(([value, label]) => <button className={filter === value ? 'active' : ''} type="button" key={value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {query.data?.summary.state?.lastSearchAt && <small>Обновлено {new Date(query.data.summary.state.lastSearchAt).toLocaleString('ru-RU')}</small>}
    </div>
    {query.isPending && <div className="vacancies-state"><span className="spinner" /> Загружаем вакансии…</div>}
    {query.isError && <div className="vacancies-state error">{errorText(query.error)}</div>}
    {query.data && !query.data.items.length && <div className="vacancies-empty"><div>⌕</div><h2>Пока ничего нет</h2><p>Проверьте настройки поиска в профиле и запустите поиск. Перед выдачей Focus сверит историю ваших откликов на HH.</p><Button onClick={() => search.mutate()} loading={search.isPending}>Запустить поиск</Button></div>}
    <section className="vacancy-list">{query.data?.items.map((item) => <VacancyCard key={item.id} item={item} updating={status.isPending && status.variables?.id === item.id} responding={generateLetter.isPending && generateLetter.variables?.vacancyId === item.vacancy.id} onStatus={(value) => status.mutate({ id: item.id, value })} onRespond={() => respond(item.vacancy.id)} />)}</section>
    {totalPages > 1 && <div className="vacancy-pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Назад</button><span>{page} из {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Вперёд →</button></div>}
    {coverLetter && <div className="cover-letter-modal" role="dialog" aria-modal="true" aria-label="Сопроводительное письмо" onMouseDown={(event) => { if (event.target === event.currentTarget) setCoverLetter(null) }}><section><header><div><span>ГОТОВОЕ ПИСЬМО</span><h2>Сопроводительное письмо</h2><p>Письмо сгенерировано, но пока никуда не отправлено.</p></div><button type="button" onClick={() => setCoverLetter(null)} aria-label="Закрыть">×</button></header><div className="cover-letter-text">{coverLetter}</div></section></div>}
  </AppLayout>
}
