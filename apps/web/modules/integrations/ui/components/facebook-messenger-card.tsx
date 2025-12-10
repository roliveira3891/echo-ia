"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

export const FacebookMessengerCard = () => {
  const t = useTranslations("integrations.facebookMessenger");
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-300 p-2">
              <Image
                alt="Facebook Messenger"
                height={50}
                src="/channels/facebook-messenger.svg"
                width={50}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              <CardDescription>
                {t("description")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t("description2")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("comingSoonMsg")}
            </p>
          </div>

          <Button
            disabled
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {t("connect")}
          </Button>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium mb-2">{t("requirements")}</p>
            <ul className="space-y-1 text-xs ml-4 list-disc">
              {t.raw("requirementsList").map((requirement: string) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
