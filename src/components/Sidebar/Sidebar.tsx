import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { hhApi } from "../../api/hh";
import { vacanciesApi } from "../../api/vacancies";
import { Brand } from "../Brand";
import { useAuthStore } from "../../store/authStore";
import "./Sidebar.css";

const nav = [
  { icon: "⌂", label: "Главная", path: "/dashboard" },
  { icon: "⌕", label: "Вакансии", path: "/vacancies" },
  { icon: "↗", label: "Отклики", path: "/responses" },
  { icon: "⚙", label: "Профиль", path: "/profile" },
];

export function Sidebar() {
  const email = useAuthStore((state) => state.user?.email);
  const logout = useAuthStore((state) => state.logout);
  const disconnectHH = useAuthStore((state) => state.disconnectHH);
  const navigate = useNavigate();
  const location = useLocation();
  const summary = useQuery({
    queryKey: ["vacancy-summary"],
    queryFn: vacanciesApi.summary,
    retry: false,
    refetchInterval: 15_000,
  });
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const handleHhDisconnect = async () => {
    if (
      !window.confirm(
        "Отключить аккаунт HH.ru? Автоотклики и поиск через HH будут остановлены.",
      )
    )
      return;
    try {
      await hhApi.disconnect();
      disconnectHH();
      navigate("/connect-hh", { replace: true });
    } catch {
      window.alert("Не удалось отключить HH.ru. Попробуйте ещё раз.");
    }
  };

  return (
    <aside className="sidebar">
      <Brand light />
      <nav>
        {nav.map(({ icon, label, path }) => (
          <button
            type="button"
            className={location.pathname === path ? "active" : ""}
            key={label}
            onClick={() => navigate(path)}
          >
            <span>{icon}</span>
            {label}
            {label === "Отклики" && (
              <em>{summary.data?.respondedCount ?? 0}</em>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="hh-status">
          <i>hh</i>
          <div>
            <b>HH.ru подключён</b>
            <small>
              <span /> Активен
            </small>
          </div>
          <button
            type="button"
            onClick={() => void handleHhDisconnect()}
            title="Выйти из HH.ru"
            aria-label="Выйти из HH.ru"
            style={{
              marginLeft: "auto",
              border: 0,
              background: "transparent",
              color: "#888d82",
              cursor: "pointer",
            }}
          >
            ↪
          </button>
        </div>
        <div className="account">
          <div className="avatar">AK</div>
          <div>
            <b>{email?.split("@")[0] || "Пользователь"}</b>
            <small>{email}</small>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Выйти из аккаунта"
            aria-label="Выйти из аккаунта"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
