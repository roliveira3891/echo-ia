"use client";

import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { AIAgentTemplate } from "../../lib/mock-data";

interface TemplateCardProps {
  template: AIAgentTemplate;
  onSelect: (templateId: string) => void;
}

export const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  const t = useTranslations("aiAgents.templates");
  const Icon = template.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow hover:border-primary/50 flex flex-col">
      <CardHeader className="flex-1">
        <div className="space-y-4">
          {/* Icon and Title in same row */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">
              {t(`${template.id}.name`)}
            </CardTitle>
          </div>

          {/* Description below */}
          <CardDescription className="text-sm">
            {t(`${template.id}.description`)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <Button
          onClick={() => onSelect(template.id)}
          className="w-full"
          variant="default"
        >
          {t("useTemplate")}
        </Button>
      </CardContent>
    </Card>
  );
};
