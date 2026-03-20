import React, { createContext, ReactNode, useContext, useState } from 'react';

interface DebugContextType {
  isDebugMode: boolean;
  setIsDebugMode: (mode: boolean) => void;
  fakeLocation: { latitude: number; longitude: number };
  setFakeLocation: (loc: { latitude: number; longitude: number }) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [fakeLocation, setFakeLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 43.025886, // Default to London, ON
    longitude: -81.296819,
  });

  return (
    <DebugContext.Provider value={{ isDebugMode, setIsDebugMode, fakeLocation, setFakeLocation }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}
