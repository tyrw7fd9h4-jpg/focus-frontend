import type { VacancyMatch, VacancyStatus } from '../../api/vacancies'
import './VacancyCard.css'
import './VacancyCardActions.css'

interface VacancyCardProps {
  item: VacancyMatch
  updating?: boolean
  responding?: boolean
  onStatus: (status: VacancyStatus) => void
  onRespond: () => void
}

const money = new Intl.NumberFormat('ru-RU')

function salary(item: VacancyMatch['vacancy']) {
  const currency = item.salaryCurrency === 'RUR' || item.salaryCurrency === 'RUB'
    ? '₽'
    : item.salaryCurrency ?? ''
  if (item.salaryFrom && item.salaryTo) return `${money.format(item.salaryFrom)}–${money.format(item.salaryTo)} ${currency}`
  if (item.salaryFrom) return `от ${money.format(item.salaryFrom)} ${currency}`
  if (item.salaryTo) return `до ${money.format(item.salaryTo)} ${currency}`
  return 'Зарплата не указана'
}

export function VacancyCard({ item, updating, responding, onStatus, onRespond }: VacancyCardProps) {
  const vacancy = item.vacancy
  return <article className="vacancy-card">
    <header>
      <div>
        <div className="vacancy-title-line">
          <h2>{vacancy.title}</h2>
        </div>
        <p className="vacancy-company">{vacancy.employerName || 'Компания не указана'}</p>
      </div>
      <button className={item.status === 'FAVORITE' ? 'favorite active' : 'favorite'} type="button" disabled={updating} onClick={() => onStatus(item.status === 'FAVORITE' ? 'NEW' : 'FAVORITE')} aria-label="Добавить в избранное">♡</button>
    </header>
    <div className="vacancy-meta">
      <b>{salary(vacancy)}</b>
      {vacancy.areaName && <span>{vacancy.areaName}</span>}
      {vacancy.experience && <span>{vacancy.experience}</span>}
      {vacancy.workFormats.map((format) => <span key={format}>{format}</span>)}
    </div>
    {vacancy.description && <p className="vacancy-description">{vacancy.description}</p>}
    {!!vacancy.keySkills.length && <div className="vacancy-skills">{vacancy.keySkills.slice(0, 7).map((skill) => <i key={skill}>{skill}</i>)}</div>}
    <div className="match-reasons">
      {item.positiveReasons.slice(0, 2).map((reason) => <span className="positive" key={reason}>✓ {reason}</span>)}
      {item.negativeReasons.slice(0, 2).map((reason) => <span className="negative" key={reason}>— {reason}</span>)}
    </div>
    <footer>
      <a href={vacancy.alternateUrl} target="_blank" rel="noreferrer">Открыть на HH ↗</a>
      {/* <button className="vacancy-respond" type="button" disabled={responding} onClick={onRespond}>{responding ? 'Генерируем…' : 'Откликнуться'}</button> */}
      <button className="vacancy-hide" type="button" disabled={updating} onClick={() => onStatus('HIDDEN')}>Скрыть</button>
    </footer>
  </article>
}
