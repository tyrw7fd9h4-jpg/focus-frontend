export type VacancyStatus =
  | 'new'
  | 'suitable'
  | 'unsuitable'
  | 'applied'

export interface Vacancy {
  id: string
  title: string
  company: string

  salaryFrom?: number
  salaryTo?: number
  salaryCurrency?: string

  remote: boolean

  location?: string
  experience?: string

  description: string

  skills: string[]

  url: string

  status: VacancyStatus
}