"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("settings.nav");

  const navItems = [
    {
      title: t("lifecycle"),
      href: `/${locale}/settings/lifecycle`,
    },
    {
      title: t("contactFields"),
      href: `/${locale}/settings/contact-fields`,
    },
    {
      title: t("tags"),
      href: `/${locale}/settings/tags`,
    },
  ];

  return (
    <nav className="flex space-x-2 border-b pb-2 mb-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
