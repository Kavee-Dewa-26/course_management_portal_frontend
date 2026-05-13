"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "@/application/store";
import { FirebaseAuthListener } from "@/components/auth/FirebaseAuthListener";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <FirebaseAuthListener>{children}</FirebaseAuthListener>
      </ThemeProvider>
    </Provider>
  );
}
