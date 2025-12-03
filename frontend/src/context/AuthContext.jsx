import { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("spl_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("spl_token"));

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("spl_user", JSON.stringify(userData));
    localStorage.setItem("spl_token", jwtToken);
    setAuthToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("spl_user");
    localStorage.removeItem("spl_token");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
