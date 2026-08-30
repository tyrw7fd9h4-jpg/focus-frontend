import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { profileApi, type JobSearchPreferences } from "../../api/profile";
import {
  vacanciesApi,
  type VacancyRecord,
  type VacancySummary,
} from "../../api/vacancies";
import { SearchPreferencesPanel } from "../../components/SearchPreferences/SearchPreferencesPanel";
import { AppLayout } from "../../layouts/AppLayout";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import "./DashboardPage.css";
import "./DashboardLinks.css";

const formats: Record<JobSearchPreferences["workFormat"], string> = {
  REMOTE_ONLY: "Только удалённо",
  REMOTE_OR_HYBRID: "Удалённо или гибрид",
  ANY: "Любой",
};

function salaryLabel(
  vacancy: Pick<
    VacancyRecord,
    "salaryFrom" | "salaryTo" | "salaryCurrency"
  > | null,
) {
  if (!vacancy || (!vacancy.salaryFrom && !vacancy.salaryTo))
    return "Не указана";
  const number = new Intl.NumberFormat("ru-RU");
  const value =
    vacancy.salaryFrom && vacancy.salaryTo
      ? `${number.format(vacancy.salaryFrom)}–${number.format(vacancy.salaryTo)}`
      : vacancy.salaryFrom
        ? `от ${number.format(vacancy.salaryFrom)}`
        : `до ${number.format(vacancy.salaryTo!)}`;
  return `${value} ${vacancy.salaryCurrency === "RUR" || vacancy.salaryCurrency === "RUB" ? "₽" : vacancy.salaryCurrency || ""}`.trim();
}

type AutomationSeverity = "success" | "info" | "warning" | "error" | "action";

type AutomationNotice = {
  severity: AutomationSeverity;
  text: string;
  action?: "connect-hh" | "sync" | "responses";
};

const stopNotices: Record<string, AutomationNotice> = {
  DAILY_LIMIT_REACHED: {
    severity: "info",
    text: "Дневной лимит автооткликов исчерпан.",
  },
  MAX_PER_RUN_REACHED: {
    severity: "info",
    text: "Достигнут лимит откликов за запуск.",
  },
  CAPTCHA_REQUIRED: {
    severity: "action",
    text: "HH просит пройти CAPTCHA. Автоотклики приостановлены.",
    action: "connect-hh",
  },
  HH_AUTH_REQUIRED: {
    severity: "action",
    text: "Нужно снова подключить аккаунт HH.",
    action: "connect-hh",
  },
  LETTER_ATTACH_FAILED: {
    severity: "error",
    text: "Не удалось приложить сопроводительное. Автоотклики остановлены, чтобы не отправлять следующие отклики без письма.",
    action: "responses",
  },
  HH_UI_CHANGED: {
    severity: "error",
    text: "Focus не смог безопасно продолжить работу с HH. Автоотклики остановлены.",
  },
  UNKNOWN_RESULT: {
    severity: "error",
    text: "Не удалось точно определить результат последнего отклика. Focus остановил автоотклики, чтобы избежать повторной отправки.",
    action: "sync",
  },
  UNKNOWN_LETTER_STATE: {
    severity: "error",
    text: "HH подтвердил отклик, но состояние сопроводительного письма неизвестно.",
    action: "sync",
  },
  STALE_RUN: {
    severity: "warning",
    text: "Предыдущая обработка была прервана. Проверьте актуальность откликов.",
  },
};

function runNotice(
  summary: VacancySummary | undefined,
): AutomationNotice | null {
  const run = summary?.automation.lastRun;
  if (!run) return null;
  if (run.stopReason && stopNotices[run.stopReason])
    return stopNotices[run.stopReason];
  if (run.status === "COMPLETED")
    return { severity: "success", text: "Автоотклики завершены." };
  if (run.status === "FAILED")
    return {
      severity: "error",
      text: "Последний запуск завершился с ошибкой. Обновите данные и попробуйте позже.",
    };
  return run.stopReason
    ? {
        severity: "warning",
        text: "Автоотклики остановлены для безопасной проверки.",
      }
    : null;
}

function formatTime(value: string | null | undefined, now: number) {
  if (!value) return "Ещё не запускался";
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000));
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SettingsSummary({
  value,
  resumePosition,
}: {
  value: JobSearchPreferences;
  resumePosition: string | null | undefined;
}) {
  return (
    <dl>
      <div>
        <dt>Должность из резюме</dt>
        <dd>{resumePosition || "Не указана"}</dd>
      </div>
      <div>
        <dt>Навыки</dt>
        <dd>
          {value.preferredSkills.length
            ? value.preferredSkills
                .slice(0, 3)
                .map((skill) => <i key={skill}>{skill}</i>)
            : "Не указаны"}
        </dd>
      </div>
      <div>
        <dt>Формат</dt>
        <dd>{formats[value.workFormat]}</dd>
      </div>
      <div>
        <dt>Мин. зарплата</dt>
        <dd>
          {value.minSalary
            ? new Intl.NumberFormat("ru-RU").format(value.minSalary) +
              " " +
              value.currency
            : "Не указана"}
        </dd>
      </div>
      <div>
        <dt>География</dt>
        <dd>{value.areas.slice(0, 2).join(", ") || "Любая"}</dd>
      </div>
      <div>
        <dt>Без зарплаты</dt>
        <dd>
          {value.allowSalaryNotSpecified ? "Рассматривать" : "Не показывать"}
        </dd>
      </div>
    </dl>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryKey: ["profile-preferences"],
    queryFn: profileApi.getPreferences,
    retry: false,
  });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
    retry: false,
  });
  const resumes = useQuery({
    queryKey: ["hh-resumes"],
    queryFn: profileApi.getResumes,
    enabled: Boolean(profile.data?.connected),
    retry: false,
  });
  const vacancySummary = useQuery({
    queryKey: ["vacancy-summary"],
    queryFn: vacanciesApi.summary,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.automation.activeRun ? 7_000 : false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const responseHistory = useQuery({
    queryKey: ["vacancy-responses"],
    queryFn: vacanciesApi.responses,
    retry: false,
  });
  const syncResume = useMutation({
    mutationFn: profileApi.selectResume,
    onSuccess: (data) => queryClient.setQueryData(["profile"], data),
  });
  const firstName = profile.data?.profile?.firstName || "друг";
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !profile.data?.connected ||
      !resumes.data?.length ||
      syncResume.isPending
    )
      return;
    const selectedResumeId = profile.data.profile?.hhResumeId;
    if (
      selectedResumeId &&
      resumes.data.some((resume) => resume.id === selectedResumeId)
    )
      return;
    syncResume.mutate(resumes.data[0].id);
  }, [profile.data, resumes.data, syncResume]);
  const autoSearch = useMutation({
    mutationFn: (enabled: boolean) =>
      profileApi.updatePreferences({
        autoSearchEnabled: enabled,
        autoApplyEnabled: enabled,
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["profile-preferences"], data);
      if (data.autoSearchEnabled && data.autoApplyEnabled) {
        await vacanciesApi.startAutoApply();
      }
      await queryClient.invalidateQueries({ queryKey: ["vacancy-summary"] });
    },
  });
  const automation = vacancySummary.data?.automation;
  const autoSearchEnabled =
    automation?.autoSearchEnabled ??
    Boolean(preferences.data?.autoSearchEnabled);
  const autoApplyEnabled =
    automation?.autoApplyEnabled ?? Boolean(preferences.data?.autoApplyEnabled);
  const activeRun = automation?.activeRun ?? null;
  const lastRun = automation?.lastRun ?? null;
  const notice = runNotice(vacancySummary.data);
  const usageLabel = vacancySummary.data
    ? vacancySummary.data.autoApplyUsage.dailyLimit === null
      ? "Сегодня отправлено: " + vacancySummary.data.autoApplyUsage.usedToday
      : "Лимит на сегодня: " +
        vacancySummary.data.autoApplyUsage.usedToday +
        " из " +
        vacancySummary.data.autoApplyUsage.dailyLimit
    : null;
  const remainingLabel = vacancySummary.data
    ? vacancySummary.data.autoApplyUsage.dailyLimit === null
      ? "Без дневного лимита"
      : "Осталось сегодня: " + vacancySummary.data.autoApplyUsage.remainingToday
    : null;
  const automationEnabled = autoSearchEnabled && autoApplyEnabled;
  const syncResponses = useMutation({
    mutationFn: vacanciesApi.syncResponses,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vacancy-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["vacancy-responses"] });
    },
  });
  const performNoticeAction = () => {
    if (notice?.action === "connect-hh") navigate("/connect-hh");
    if (notice?.action === "responses") navigate("/responses");
    if (notice?.action === "sync") syncResponses.mutate();
  };
  const stats = [
    [
      "Найдено подходящих вакансий",
      String(vacancySummary.data?.total ?? 0),
      "Открыть",
      "⌕",
      "/vacancies",
    ],
    [
      "Отправлено откликов",
      String(vacancySummary.data?.respondedCount ?? 0),
      "HH",
      "↗",
      "/responses",
    ],
    ["Получено ответов", "—", "Скоро", "✉", ""],
  ];
  return (
    <AppLayout>
      <div className="dash-head">
        <div>
          <p>СРЕДА, 26 АВГУСТА</p>
          <h1>Добрый день, {firstName}</h1>
          <span>Вот что происходит с вашим поиском работы.</span>
        </div>
        <button className="notification">
          ♢<i>3</i>
        </button>
      </div>
      <Card className="search-hero">
        <div className="search-copy">
          <div className="search-icon">⌕</div>
          <div>
            <div className="title-line">
              <h2>Автопоиск вакансий</h2>
              {vacancySummary.isPending ? (
                <Badge tone="neutral">Загружаем…</Badge>
              ) : (
                <Badge
                  tone={activeRun || autoSearchEnabled ? "green" : "neutral"}
                >
                  ●{" "}
                  {activeRun
                    ? "Отклики отправляются"
                    : autoSearchEnabled
                      ? "Работает"
                      : "Остановлен"}
                </Badge>
              )}
            </div>
            <p>
              {vacancySummary.isError
                ? "Не удалось получить состояние автопоиска."
                : activeRun
                  ? "Focus обрабатывает подходящие вакансии."
                  : !autoSearchEnabled && autoApplyEnabled
                    ? "Автоотклики включены, но не выполняются, пока автопоиск остановлен."
                    : autoApplyEnabled
                      ? "Автоотклики включены."
                      : "Автоотклики выключены."}
            </p>
          </div>
        </div>
        <div className="run-info">
          <div>
            <small>ВАКАНСИИ ОБНОВЛЕНЫ</small>
            <b>{formatTime(vacancySummary.data?.state?.lastSearchAt, now)}</b>
          </div>
          <div>
            <small>НАЙДЕНО ЗА ПОСЛЕДНИЙ ПОИСК</small>
            <b>{vacancySummary.data?.state?.lastFoundCount ?? "—"}</b>
          </div>
          <div>
            <small>АВТОПОИСК</small>
            <b>{autoSearchEnabled ? "Работает" : "Остановлен"}</b>
          </div>
          <div>
            <small>АВТООТКЛИКИ</small>
            <b>{autoApplyEnabled ? "Включены" : "Выключены"}</b>
          </div>
        </div>
        <Button
          variant={automationEnabled ? "danger" : "primary"}
          loading={autoSearch.isPending}
          disabled={!preferences.data || vacancySummary.isPending}
          onClick={() => autoSearch.mutate(!automationEnabled)}
        >
          {automationEnabled ? "■  Остановить" : "▶  Запустить"}
        </Button>
        {!activeRun && usageLabel && (
          <div className="automation-status info" role="status">
            <div>
              <b>{remainingLabel}</b>
              <span>
                {usageLabel} · Тариф: {vacancySummary.data?.plan.name}
              </span>
            </div>
          </div>
        )}{" "}
        {activeRun && (
          <div className="automation-status info" role="status">
            <div>
              <b>Отправляем отклики…</b>
              <span>
                Отправлено в запуске: {activeRun.sentCount}
                {remainingLabel ? " · " + remainingLabel : ""}
              </span>
            </div>
          </div>
        )}
        {!activeRun && notice && (
          <div
            className={"automation-status " + notice.severity}
            role={
              notice.severity === "error" || notice.severity === "action"
                ? "alert"
                : "status"
            }
          >
            <div>
              <b>{notice.text}</b>
              {lastRun && (
                <span>
                  Последний запуск:{" "}
                  {formatTime(lastRun.finishedAt ?? lastRun.startedAt, now)} ·
                  Отправлено: {lastRun.sentCount}
                </span>
              )}
            </div>
            {notice.action && (
              <button
                type="button"
                disabled={syncResponses.isPending}
                onClick={performNoticeAction}
              >
                {notice.action === "connect-hh"
                  ? "Подключить HH"
                  : notice.action === "sync"
                    ? "Обновить данные"
                    : "Открыть отклики"}
              </button>
            )}
          </div>
        )}
        {vacancySummary.isError && (
          <div className="automation-status error" role="alert">
            <div>
              <b>Не удалось получить состояние автопоиска.</b>
            </div>
            <button type="button" onClick={() => vacancySummary.refetch()}>
              Повторить
            </button>
          </div>
        )}
      </Card>
      <section className="stats-grid">
        {stats.map(([label, value, delta, icon, path]) => (
          <Card
            className={`stat ${path ? "stat-link" : ""}`}
            key={label}
            role={path ? "link" : undefined}
            tabIndex={path ? 0 : undefined}
            onClick={() => path && navigate(path)}
            onKeyDown={(event) => {
              if (path && (event.key === "Enter" || event.key === " "))
                navigate(path);
            }}
          >
            <div>
              <span>{icon}</span>
              <em>{delta}</em>
            </div>
            <b>{value}</b>
            <p>{label}</p>
          </Card>
        ))}
      </section>
      <section className="dashboard-grid">
        <Card className="responses">
          <div className="section-head">
            <div>
              <h2>Последние отклики</h2>
              <p>Актуальные статусы ваших заявок</p>
            </div>
            <button type="button" onClick={() => navigate("/responses")}>
              Все отклики →
            </button>
          </div>
          <div className="table">
            <div className="tr th">
              <span>ВАКАНСИЯ</span>
              <span>ЗАРПЛАТА</span>
              <span>СТАТУС</span>
              <span>ВРЕМЯ</span>
            </div>
            {responseHistory.isPending && (
              <div className="tr">
                <span>Загружаем отклики…</span>
              </div>
            )}
            {responseHistory.data?.map((item) => (
              <div className="tr" key={item.hhVacancyId}>
                <span>
                  <b>{item.vacancy?.title || "Вакансия HH.ru"}</b>
                  <small>
                    {item.vacancy?.employerName || "Компания не указана"}
                  </small>
                </span>
                <span>{salaryLabel(item.vacancy)}</span>
                <span>
                  <Badge tone={item.coverLetterAttached ? "green" : "amber"}>
                    {item.coverLetterAttached
                      ? "Отправлен с письмом"
                      : "Отправлен без письма"}
                  </Badge>
                </span>
                <span>
                  {new Date(item.respondedAt).toLocaleString("ru-RU")}
                </span>
              </div>
            ))}
            {!responseHistory.isPending && !responseHistory.data?.length && (
              <div className="tr">
                <span>Откликов пока нет</span>
              </div>
            )}
          </div>
        </Card>
        <Card className="settings">
          <div className="section-head">
            <div>
              <h2>Настройки поиска</h2>
              <p>Актуальные параметры</p>
            </div>
            <button type="button" onClick={() => setEditing(true)}>
              ✎
            </button>
          </div>
          {(preferences.isPending || profile.isPending) && (
            <div className="settings-state">
              <span className="spinner" /> Загружаем…
            </div>
          )}
          {(preferences.isError || profile.isError) && (
            <div className="settings-state error">Не удалось загрузить</div>
          )}
          {preferences.data && profile.data && (
            <SettingsSummary
              value={preferences.data}
              resumePosition={profile.data.profile?.desiredPosition}
            />
          )}
          <Button
            variant="secondary"
            disabled={!preferences.data}
            onClick={() => setEditing(true)}
          >
            Изменить настройки
          </Button>
        </Card>
      </section>
      {editing && preferences.data && (
        <div
          className="preferences-modal"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(false);
          }}
        >
          <section className="preferences-drawer">
            <header>
              <div>
                <span>НАСТРОЙКИ АВТОПОИСКА</span>
                <h2>Настройки поиска</h2>
                <p>Изменения повлияют на следующий запуск Focus.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </header>
            <SearchPreferencesPanel
              initial={preferences.data}
              resumePosition={profile.data?.profile?.desiredPosition}
              onSaved={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          </section>
        </div>
      )}
    </AppLayout>
  );
}
