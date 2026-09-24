import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const UserContext = createContext(null);

const STORAGE_KEYS = {
  TOKEN: "token",
  NAME: "offerstackr_user_name",
  AVATAR: "offerstackr_user_avatar",
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cachedName = localStorage.getItem(STORAGE_KEYS.NAME);
      const cachedAvatar = localStorage.getItem(STORAGE_KEYS.AVATAR);
      if (cachedName || cachedAvatar) {
        return {
          name: cachedName || "User",
          avatar_url: cachedAvatar || null,
        };
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const syncLocalStorage = (userData) => {
    if (!userData) {
      localStorage.removeItem(STORAGE_KEYS.NAME);
      localStorage.removeItem(STORAGE_KEYS.AVATAR);
      return;
    }
    if (userData.name) {
      localStorage.setItem(STORAGE_KEYS.NAME, userData.name.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.NAME);
    }
    if (userData.avatar_url) {
      localStorage.setItem(STORAGE_KEYS.AVATAR, userData.avatar_url);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AVATAR);
    }
  };

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const res = await api.get("/profile");
      if (res?.data) {
        setUser(res.data);
        syncLocalStorage(res.data);
        return res.data;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        syncLocalStorage(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchUser();

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.NAME || e.key === STORAGE_KEYS.AVATAR || e.key === STORAGE_KEYS.TOKEN) {
        fetchUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUser]);

  const updateUser = (data) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      syncLocalStorage(updated);
      return updated;
    });
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res?.data) {
      setUser(res.data);
      syncLocalStorage(res.data);
      return res.data;
    }
  };

  const removeAvatar = async () => {
    const res = await api.delete("/profile/avatar");
    if (res?.data) {
      setUser(res.data);
      syncLocalStorage(res.data);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    syncLocalStorage(null);
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        fetchUser,
        updateUser,
        uploadAvatar,
        removeAvatar,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
