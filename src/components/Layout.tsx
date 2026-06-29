import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <span className="tab-icon">📅</span>
          <span>日历</span>
        </NavLink>
        <NavLink to="/photos" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <span className="tab-icon">📷</span>
          <span>照片</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <span className="tab-icon">📜</span>
          <span>历史</span>
        </NavLink>
      </nav>
    </div>
  );
}
