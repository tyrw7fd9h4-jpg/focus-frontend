import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProfileError,
  profileApi,
  type JobSearchPreferences,
  type PreferencesPayload,
} from '../../api/profile'
import { Button } from '../ui/Button'
import { TagInput } from '../ui/TagInput'
import './SearchPreferencesPanel.css'

const employmentOptions = [
  ['LABOR_CONTRACT', 'Трудовой договор'],
  ['CIVIL_CONTRACT', 'ГПХ'],
  ['INDIVIDUAL_ENTREPRENEUR', 'ИП'],
  ['SELF_EMPLOYED', 'Самозанятость'],
  ['OTHER', 'Другое'],
  ['ANY', 'Не важно'],
]

type Props = {
  initial: JobSearchPreferences
  resumePosition?: string | null
  onSaved: () => void
  onCancel: () => void
}

export function SearchPreferencesPanel({ initial, resumePosition, onSaved, onCancel }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PreferencesPayload>({
    desiredPositions: initial.desiredPositions,
    desiredSpecializations: initial.desiredSpecializations,
    preferredSkills: initial.preferredSkills,
    allowedSkills: initial.allowedSkills,
    excludedSkills: initial.excludedSkills,
    minGrade: initial.minGrade,
    maxGrade: initial.maxGrade,
    allowRelatedRoles: initial.allowRelatedRoles,
    workFormat: initial.workFormat,
    minSalary: initial.minSalary,
    currency: initial.currency,
    allowSalaryNotSpecified: initial.allowSalaryNotSpecified,
    areas: initial.areas,
    allowOtherAreas: initial.allowOtherAreas,
    employmentTypes: initial.employmentTypes,
    accreditedCompanyPreference: initial.accreditedCompanyPreference,
    stopWords: initial.stopWords,
    excludedCompanies: initial.excludedCompanies,
    autoSearchEnabled: initial.autoSearchEnabled,
    autoApplyEnabled: initial.autoApplyEnabled,
  })
  const update = <K extends keyof PreferencesPayload>(key: K, value: PreferencesPayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const save = useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile-preferences'], data)
      onSaved()
    },
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(form)
  }
  const toggleEmployment = (value: string) => {
    if (value === 'ANY') {
      update('employmentTypes', form.employmentTypes.includes('ANY') ? [] : ['ANY'])
      return
    }
    const withoutAny = form.employmentTypes.filter((item) => item !== 'ANY')
    update('employmentTypes', withoutAny.includes(value) ? withoutAny.filter((item) => item !== value) : [...withoutAny, value])
  }

  return <form className="search-preferences-form" onSubmit={submit}>
    <fieldset>
      <div className="preferences-legend"><span>1</span><div><b>Навыки</b><small>Должность берётся из выбранного резюме HH</small></div></div>
      <div className="resume-position"><span>Должность из резюме</span><b>{resumePosition || 'Не указана'}</b></div>
      <TagInput label="Предпочтительные навыки" value={form.preferredSkills} onChange={(value) => update('preferredSkills', value)} placeholder="React, TypeScript…" />
      <label className="check-row"><input type="checkbox" checked={form.allowRelatedRoles} onChange={(event) => update('allowRelatedRoles', event.target.checked)} /><span><b>Рассматривать смежные роли</b></span></label>
    </fieldset>
    <fieldset>
      <div className="preferences-legend"><span>2</span><div><b>Формат и зарплата</b><small>Условия работы и минимальный доход</small></div></div>
      <label className="profile-field"><span>Формат работы</span><select value={form.workFormat} onChange={(event) => update('workFormat', event.target.value as PreferencesPayload['workFormat'])}><option value="REMOTE_ONLY">Только удалённо</option><option value="REMOTE_OR_HYBRID">Удалённо + гибрид</option><option value="ANY">Любой формат</option></select></label>
      <div className="form-grid salary-grid"><label className="profile-field"><span>Минимальная зарплата</span><input type="number" min="0" placeholder="150000" value={form.minSalary ?? ''} onChange={(event) => update('minSalary', event.target.value ? Number(event.target.value) : null)} /></label><label className="profile-field"><span>Валюта</span><select value={form.currency} onChange={(event) => update('currency', event.target.value)}><option>RUB</option><option>USD</option><option>EUR</option><option>KZT</option><option>BYN</option></select></label></div>
      <label className="check-row"><input type="checkbox" checked={form.allowSalaryNotSpecified} onChange={(event) => update('allowSalaryNotSpecified', event.target.checked)} /><span><b>Показывать вакансии без зарплаты</b></span></label>
    </fieldset>
    <fieldset>
      <div className="preferences-legend"><span>3</span><div><b>География и оформление</b><small>Города и типы занятости</small></div></div>
      <TagInput label="Города и регионы" value={form.areas} onChange={(value) => update('areas', value)} placeholder="Москва, Санкт-Петербург…" />
      <label className="check-row"><input type="checkbox" checked={form.allowOtherAreas} onChange={(event) => update('allowOtherAreas', event.target.checked)} /><span><b>Рассматривать другие регионы</b></span></label>
      <div className="multi-checks">{employmentOptions.map(([value, label]) => <label key={value}><input type="checkbox" checked={form.employmentTypes.includes(value)} onChange={() => toggleEmployment(value)} /><span>{label}</span></label>)}</div>
    </fieldset>
    <fieldset>
      <div className="preferences-legend"><span>4</span><div><b>Исключения</b><small>Что не должно попадать в поиск</small></div></div>
      <TagInput label="Стоп-слова" value={form.stopWords} onChange={(value) => update('stopWords', value)} placeholder="Продажи, холодные звонки…" />
      <TagInput label="Нежелательные компании" value={form.excludedCompanies} onChange={(value) => update('excludedCompanies', value)} placeholder="Название компании" />
    </fieldset>
    {save.error && <div className="profile-message error" role="alert">{getProfileError(save.error)}</div>}
    <div className="preferences-actions"><Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button><Button type="submit" loading={save.isPending}>Сохранить настройки</Button></div>
  </form>
}
