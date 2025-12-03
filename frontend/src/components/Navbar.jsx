import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        <Link to="/" className="font-semibold text-lg">
          🌱 Smart Plant Logger
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link to="/settings" className="text-sm hover:underline">
                Settings
              </Link>
              <span className="text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1 border border-slate-500 rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
