import { useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import { useAuthStore } from '../../store/authStore'
import './Sidebar.css'

const nav = [['⌂', 'Главная'], ['⌕', 'Автопоиск'], ['↗', 'Отклики'], ['⚙', 'Настройки']]

export function Sidebar() {
  const email = useAuthStore((state) => state.user?.email)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return <aside className="sidebar">
    <Brand light />
    <nav>{nav.map(([icon, label], index) => <button className={index === 0 ? 'active' : ''} key={label}><span>{icon}</span>{label}{label === 'Отклики' && <em>8</em>}</button>)}</nav>
    <div className="sidebar-bottom">
      <div className="hh-status"><i>hh</i><div><b>HH.ru подключён</b><small><span /> Активен</small></div></div>
      <div className="account">
        <div className="avatar">AK</div>
        <div><b>{email?.split('@')[0] || 'Пользователь'}</b><small>{email}</small></div>
        <button type="button" onClick={handleLogout} title="Выйти из аккаунта" aria-label="Выйти из аккаунта">↪</button>
      </div>
    </div>
  </aside>
}
