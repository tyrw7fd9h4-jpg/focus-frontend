import { useQuery } from "@tanstack/react-query";
import { vacanciesApi, type VacancyRecord } from "../api/vacancies";
import { AppLayout } from "../layouts/AppLayout";
import { Badge } from "../components/ui/Badge";
import "./ResponsesPage.css";

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
  const currency =
    vacancy.salaryCurrency === "RUR" || vacancy.salaryCurrency === "RUB"
      ? "₽"
      : vacancy.salaryCurrency || "";
  return `${value} ${currency}`.trim();
}

export function ResponsesPage() {
  const responses = useQuery({
    queryKey: ["vacancy-responses"],
    queryFn: vacanciesApi.responses,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  return (
    <AppLayout>
      <header className="responses-page-head">
        <div>
          <p>ИСТОРИЯ FOCUS</p>
          <h1>Отклики</h1>
          <span>
            Все отклики, отправленные этим приложением с подключённого аккаунта
            HH.ru.
          </span>
        </div>
        <b>{responses.data?.length ?? "—"}</b>
      </header>

      <section className="responses-table-wrap">
        {responses.isPending && (
          <div className="responses-page-state">
            <span className="spinner" /> Загружаем отклики…
          </div>
        )}
        {responses.isError && (
          <div className="responses-page-state error">
            Не удалось загрузить отклики
          </div>
        )}
        {responses.data && responses.data.length === 0 && (
          <div className="responses-page-state">Откликов Focus пока нет.</div>
        )}
        {responses.data && responses.data.length > 0 && (
          <table className="responses-table">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th>Компания</th>
                <th>Зарплата</th>
                <th>Сопроводительное</th>
                <th>Отправлено</th>
                <th>HH</th>
              </tr>
            </thead>
            <tbody>
              {responses.data.map((item) => (
                <tr key={item.hhVacancyId}>
                  <td>
                    <strong>{item.vacancy?.title || "Вакансия HH.ru"}</strong>
                  </td>
                  <td>{item.vacancy?.employerName || "Не указана"}</td>
                  <td>{salaryLabel(item.vacancy)}</td>
                  <td>
                    <Badge tone={item.coverLetterAttached ? "green" : "amber"}>
                      {item.coverLetterAttached ? "Приложено" : "Без письма"}
                    </Badge>
                  </td>
                  <td>{new Date(item.respondedAt).toLocaleString("ru-RU")}</td>
                  <td>
                    <a
                      href={`https://hh.ru/vacancy/${item.hhVacancyId}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Открыть вакансию на HH.ru"
                    >
                      ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppLayout>
  );
}
