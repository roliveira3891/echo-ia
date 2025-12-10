import { SettingsNav } from "@/modules/settings/ui/components/settings-nav";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <SettingsNav />

      <div>{children}</div>
    </div>
  );
}
