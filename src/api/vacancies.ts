import { api } from "./api";

export type VacancyStatus = "NEW" | "FAVORITE" | "HIDDEN";

export interface VacancyRecord {
  id: number;
  hhVacancyId: string;
  title: string;
  employerName: string | null;
  areaName: string | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  salaryCurrency: string | null;
  salaryGross: boolean | null;
  experience: string | null;
  workFormats: string[];
  employment: string | null;
  description: string | null;
  keySkills: string[];
  alternateUrl: string;
  publishedAt: string | null;
  responseLetterRequired: boolean;
}

export interface VacancyMatch {
  id: number;
  score: number;
  suitable: boolean;
  positiveReasons: string[];
  negativeReasons: string[];
  status: VacancyStatus;
  matchedAt: string;
  vacancy: VacancyRecord;
}

export type AutoApplyRunStatus = "RUNNING" | "COMPLETED" | "STOPPED" | "FAILED";

export interface AutomationRun {
  id: number;
  startedAt: string;
  sentCount: number;
  status?: AutoApplyRunStatus;
  finishedAt?: string | null;
  stopReason?: string | null;
}

export interface VacancySummary {
  total: number;
  suitable: number;
  favorites: number;
  respondedCount: number;
  plan: { code: string; name: string };
  autoApplyUsage: {
    usedToday: number;
    dailyLimit: number | null;
    remainingToday: number | null;
  };
  state: null | {
    lastSearchAt: string | null;
    lastResponsesSyncAt: string | null;
    respondedCount: number;
    lastFoundCount: number;
    lastSuitableCount: number;
    lastError: string | null;
  };
  automation: {
    autoSearchEnabled: boolean;
    autoApplyEnabled: boolean;
    activeRun: AutomationRun | null;
    lastRun: AutomationRun | null;
  };
}

export interface VacancyList {
  items: VacancyMatch[];
  total: number;
  page: number;
  limit: number;
  summary: VacancySummary;
}

export interface VacancySearchResult {
  foundCount: number;
  suitableCount: number;
  excludedRespondedCount: number;
  responsesSyncedCount: number;
  searchedAt: string;
}

export interface GeneratedCoverLetter {
  text: string;
}

export interface AutoApplyStartResult {
  started: boolean;
  alreadyRunning?: boolean;
  maxPerRun?: number;
}

export interface ResponseHistoryItem {
  hhVacancyId: string;
  respondedAt: string;
  coverLetterAttached: boolean;
  status: string;
  errorCode: string | null;
  vacancy: Pick<
    VacancyRecord,
    | "hhVacancyId"
    | "title"
    | "employerName"
    | "salaryFrom"
    | "salaryTo"
    | "salaryCurrency"
    | "salaryGross"
  > | null;
}

export const vacanciesApi = {
  list: async (params: { match?: string; status?: string; page?: number }) =>
    (await api.get<VacancyList>("/vacancies", { params })).data,
  summary: async () =>
    (await api.get<VacancySummary>("/vacancies/summary")).data,
  responses: async () =>
    (await api.get<ResponseHistoryItem[]>("/vacancies/responses")).data,
  search: async () =>
    (await api.post<VacancySearchResult>("/vacancies/search")).data,
  syncResponses: async () =>
    (
      await api.post<{ count: number; syncedAt: string }>(
        "/vacancies/sync-responses",
      )
    ).data,
  generateCoverLetter: async (resumeId: number, vacancyId: number) =>
    (
      await api.post<GeneratedCoverLetter>("/cover-letters/generate", {
        resumeId,
        vacancyId,
      })
    ).data,
  startAutoApply: async () =>
    (await api.post<AutoApplyStartResult>("/auto-apply/start")).data,
  updateStatus: async (id: number, status: VacancyStatus) =>
    (await api.patch(`/vacancies/${id}/status`, { status })).data,
};
