import Navbar from "./Navbar.jsx";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto p-4">{children}</main>
    </div>
  );
};

export default Layout;
