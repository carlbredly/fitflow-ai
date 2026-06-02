import { Suspense, type ReactNode } from "react";
import { PageLoading } from "@/components/app/PageLoading";

export default function NutritionLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoading title="Nutrition" />}>{children}</Suspense>;
}
