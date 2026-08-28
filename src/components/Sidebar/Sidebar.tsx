import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../Brand'
import { useAuthStore } from '../../store/authStore'
import './Sidebar.css'

const nav = [
  { icon: '⌂', label: 'Главная', path: '/dashboard' },
  { icon: '⌕', label: 'Автопоиск', path: '/dashboard' },
  { icon: '↗', label: 'Отклики', path: '/dashboard' },
  { icon: '⚙', label: 'Профиль', path: '/profile' },
]

export function Sidebar() {
  const email = useAuthStore((state) => state.user?.email)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return <aside className="sidebar">
    <Brand light />
    <nav>{nav.map(({ icon, label, path }, index) => <button type="button" className={(path === '/profile' ? location.pathname === path : location.pathname === '/dashboard' && index === 0) ? 'active' : ''} key={label} onClick={() => navigate(path)}><span>{icon}</span>{label}{label === 'Отклики' && <em>8</em>}</button>)}</nav>
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
