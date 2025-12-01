"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations();
  const addUser = useMutation(api.users.add);

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4">
      <h1 className="text-2xl font-bold">{t('dashboard.welcome')}</h1>
      <p className="text-gray-600">{t('dashboard.title')}</p>

      <div className="flex gap-4 mt-8">
        <UserButton />
        <OrganizationSwitcher hidePersonal />
      </div>

      <Button
        onClick={() => addUser()}
        className="mt-4"
      >
        {t('dashboard.addButton')}
      </Button>
    </div>
  )
}
