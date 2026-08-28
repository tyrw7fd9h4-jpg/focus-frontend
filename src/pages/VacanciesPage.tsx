import { VacancyCard } from '../components/VacancyCard/VacancyCard'
import type { Vacancy } from '../types/vacancy'

const vacancies: Vacancy[] = [
  {
    id: '1',
    title: 'Frontend Developer React',
    company: 'Tech Company',
    salaryFrom: 180000,
    salaryTo: 230000,
    salaryCurrency: '₽',
    remote: true,
    location: 'Москва',
    experience: '3–6 лет',
    description: 'Разработка интерфейсов на React и TypeScript',
    skills: ['React', 'TypeScript', 'Redux', 'REST'],
    url: 'https://hh.ru',
    status: 'new',
  },
  {
    id: '2',
    title: 'Middle Frontend Developer',
    company: 'Fintech',
    remote: true,
    location: 'Санкт-Петербург',
    experience: '1–3 года',
    description: 'Разработка SPA и внутренних сервисов',
    skills: ['React', 'TypeScript', 'React Query'],
    url: 'https://hh.ru',
    status: 'new',
  },
]

export const VacanciesPage = () => {
  return (
    <main>
      <h1>Софи</h1>

      <section>
        <button>React</button>
        <button>Удалёнка</button>
        <button>от 150 000 ₽</button>
      </section>

      <p>Найдено: {vacancies.length}</p>

      <section>
        {vacancies.map((vacancy) => (
          <VacancyCard key={vacancy.id} vacancy={vacancy} />
        ))}
      </section>
    </main>
  )
}