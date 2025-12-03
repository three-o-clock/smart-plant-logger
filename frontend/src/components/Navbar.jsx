import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <span className="text-lg">🌱</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-800">
              Smart Plant Watering
            </div>
            <div className="text-[11px] text-slate-500">
              Monitoring & Logging Dashboard
            </div>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2 text-xs">
              <NavLink to="/" label="Dashboard" active={isActive("/")} />
              <NavLink
                to="/settings"
                label="Settings"
                active={isActive("/settings")}
              />
            </nav>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-slate-800">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {user.email}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-300 flex items-center justify-center text-xs text-emerald-700">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] px-3 py-1 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const NavLink = ({ to, label, active }) => (
  <Link
    to={to}
    className={`px-3 py-1 rounded-full border text-[11px] ${
      active
        ? "bg-emerald-500 text-white border-emerald-500"
        : "border-slate-300 text-slate-700 hover:bg-slate-100"
    }`}
  >
    {label}
  </Link>
);

export default Navbar;
