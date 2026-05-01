import { createContext, useContext, useState } from "react";

const PendingContext = createContext();

export function PendingProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  return (
    <PendingContext.Provider value={{ pendingCount, setPendingCount }}>
      {children}
    </PendingContext.Provider>
  );
}

export function usePending() {
  return useContext(PendingContext);
}
