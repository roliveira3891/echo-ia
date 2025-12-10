"use client";

import { useTranslations } from "next-intl";

export function ContactsView() {
  const t = useTranslations("contacts");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground text-center">
            Lista de contatos em desenvolvimento...
          </p>
        </div>
      </div>
    </div>
  );
}
