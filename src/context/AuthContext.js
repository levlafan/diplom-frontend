"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

const TOKEN_KEY = "eiry_token";
const USER_KEY = "eiry_user";

const AuthContext = createContext({
  user: null,
  token: "",
  isHydrated: false,
  notifications: [],
  unreadNotifications: 0,
  markNotificationsRead: () => {},
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || "";
    const rawUser = localStorage.getItem(USER_KEY);
    let parsedUser = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch {
        parsedUser = null;
      }
    }

    const timer = setTimeout(() => {
      setToken(storedToken);
      setUser(parsedUser);
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
    setNotifications([]);
    setUnreadNotifications(0);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setUnreadNotifications(0);
  }, []);

  useEffect(() => {
    if (!isHydrated || !token || !user?.id) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "mt1";

    if (!key) {
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: "pusher",
      key,
      cluster,
      forceTLS: true,
      authEndpoint: `${baseUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    const channelName = `user.${user.id}`;
    echo
      .private(channelName)
      .listen(".notification.received", (payload) => {
        setNotifications((prev) => [payload, ...prev].slice(0, 20));
        setUnreadNotifications((prev) => prev + 1);
      });

    return () => {
      echo.leaveChannel(`private-${channelName}`);
      echo.disconnect();
    };
  }, [isHydrated, token, user?.id]);

  const value = useMemo(
    () => ({
      user,
      token,
      isHydrated,
      notifications,
      unreadNotifications,
      markNotificationsRead,
      login,
      logout,
    }),
    [user, token, isHydrated, notifications, unreadNotifications, markNotificationsRead, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
