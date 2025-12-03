import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import SettingsPage from "./components/SettingsPage.jsx";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
