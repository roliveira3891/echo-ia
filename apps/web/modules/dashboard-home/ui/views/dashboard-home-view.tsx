"use client";

import { useTranslations } from "next-intl";

export function DashboardHomeView() {
  const t = useTranslations("dashboardHome");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground text-center">
            Dashboard em desenvolvimento...
          </p>
        </div>
      </div>
    </div>
  );
}
