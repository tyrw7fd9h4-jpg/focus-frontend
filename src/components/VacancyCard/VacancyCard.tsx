import type { Vacancy } from '../../types/vacancy'

interface VacancyCardProps {
  vacancy: Vacancy
}

export const VacancyCard = ({ vacancy }: VacancyCardProps) => {
  const salary = vacancy.salaryFrom
    ? `от ${vacancy.salaryFrom.toLocaleString('ru-RU')} ${vacancy.salaryCurrency ?? '₽'}`
    : 'Зарплата не указана'

  return (
    <article className="vacancy-card">
      <div>
        <h2>{vacancy.title}</h2>
        <p>{vacancy.company}</p>

        <p>
          {salary}
          {vacancy.remote && ' · Удалённо'}
        </p>

        <div>
          {vacancy.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>

      <div>
        <button>Подробнее</button>
        <button>Подготовить отклик</button>
      </div>
    </article>
  )
}