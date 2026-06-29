import { NavLink, Outlet } from 'react-router-dom';

import { TabIconDiary, TabIconHistory, TabIconPhoto } from './TabIcons';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <main className="layout-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <TabIconDiary active={isActive} />
              <span>日记</span>
            </>
          )}
        </NavLink>
        <NavLink to="/photos" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <TabIconPhoto active={isActive} />
              <span>照片</span>
            </>
          )}
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          {({ isActive }) => (
            <>
              <TabIconHistory active={isActive} />
              <span>历史</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
