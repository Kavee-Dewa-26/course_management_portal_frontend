"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { store, persistor } from "@/application/store";
import { FirebaseAuthListener } from "@/components/auth/FirebaseAuthListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <FirebaseAuthListener>{children}</FirebaseAuthListener>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
