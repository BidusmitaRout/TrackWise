import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const AUTH_KEY = 'trackWiseAuthUser';

const navLinks = [
  { label: 'Tracker', to: '/tracker' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Courses', to: '/courses' },
  { label: 'Resources', to: '/resources' },
  { label: 'Forums', to: '/forums' },
];

const activeClass =
  'text-primary border-primary border-b-2 pb-1 transition-colors duration-150';
const inactiveClass =
  'text-white/70 hover:text-white transition-colors duration-150 pb-1 border-b-2 border-transparent';

function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
        setUser(stored);
      } catch {
        setUser(null);
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-white/5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="h-3 w-3 rounded bg-primary"></span>
          <span className="text-lg font-semibold">TrackWise</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? activeClass : inactiveClass
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-white/80 text-sm">
                Hi, <span className="font-semibold">{user.name || 'Learner'}</span>
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white hover:border-white/40 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-white/80 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-white/80"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  isActive ? activeClass : inactiveClass
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <>
                  <span className="text-sm text-white/80">
                    Signed in as {user.name || 'Learner'}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-white/40 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-white/80 hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90 transition"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

