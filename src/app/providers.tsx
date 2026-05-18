"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { store, persistor } from "@/application/store";
import { FirebaseAuthListener } from "@/components/auth/FirebaseAuthListener";
import { IntlBridge } from "@/application/i18n/IntlBridge";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <IntlBridge>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <FirebaseAuthListener>{children}</FirebaseAuthListener>
          </ThemeProvider>
        </IntlBridge>
      </PersistGate>
    </Provider>
  );
}
