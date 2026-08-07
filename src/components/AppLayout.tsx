import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { initials } from '../lib/format'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◲', end: true },
  { to: '/pipeline', label: 'Pipeline', icon: '◐' },
  { to: '/leads', label: 'Prospek', icon: '◍' },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">Aldef Sales OS</div>
            <div className="brand-sub">{user?.tenant.name}</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name ?? '')}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={logout}>
            Keluar
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
