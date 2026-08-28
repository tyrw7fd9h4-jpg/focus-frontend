import './AccountMenu.css'

type AccountMenuProps = {
  email?: string
  label?: string
  onLeaveHH: () => void
  onLogout: () => void
}

export function AccountMenu({ email, label, onLeaveHH, onLogout }: AccountMenuProps) {
  return <div className="connect-header-actions">
    {label && <span>{label}</span>}
    <details className="account-menu">
      <summary aria-label="Открыть меню аккаунта"><span className="header-avatar">{email?.slice(0, 1).toUpperCase() || 'A'}</span><span className="header-email">{email}</span><i>⌄</i></summary>
      <div className="account-dropdown">
        <div className="dropdown-user"><b>{email?.split('@')[0] || 'Пользователь'}</b><small>{email}</small></div>
        <button type="button" onClick={onLeaveHH}><span>hh</span><div><b>Выйти из HH.ru</b><small>Отключить HH-сессию</small></div></button>
        <button type="button" className="logout-action" onClick={onLogout}><span>↪</span><div><b>Выйти из системы</b><small>Завершить сессию Focus</small></div></button>
      </div>
    </details>
  </div>
}
