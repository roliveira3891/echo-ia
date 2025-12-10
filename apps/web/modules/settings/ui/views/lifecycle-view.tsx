"use client";

import { useTranslations } from "next-intl";

export function LifecycleView() {
  const t = useTranslations("settings.lifecycle");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground text-center">
            Configuração de ciclo de vida em desenvolvimento...
          </p>
        </div>
      </div>
    </div>
  );
}
