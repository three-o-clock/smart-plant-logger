import Navbar from "./Navbar.jsx";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-100 text-slate-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pb-8 pt-4">
        <main className="bg-white/90 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm backdrop-blur">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
