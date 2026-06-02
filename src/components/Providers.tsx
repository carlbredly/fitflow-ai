"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthRouter } from "@/components/app/AuthRouter";
import { PwaProvider } from "@/components/app/PwaProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PwaProvider>
        <AuthRouter>{children}</AuthRouter>
      </PwaProvider>
    </QueryClientProvider>
  );
}
