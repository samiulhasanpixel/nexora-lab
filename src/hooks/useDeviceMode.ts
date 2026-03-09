import { useState, useEffect } from "react";

export type DeviceMode = 'mobile' | 'desktop' | null;

const STORAGE_KEY = 'queuepro_device_mode';

export function useDeviceMode() {
  const [mode, setMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as DeviceMode) || null;
  });

  const selectMode = (m: 'mobile' | 'desktop') => {
    localStorage.setItem(STORAGE_KEY, m);
    setMode(m);
  };

  const clearMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMode(null);
  };

  return { mode, selectMode, clearMode };
}
