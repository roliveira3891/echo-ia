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
    <Card className="overflow-hidden hover:shadow-md transition-shadow hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t(`${template.id}.name`)}
              </CardTitle>
              <CardDescription className="mt-1">
                {t(`${template.id}.description`)}
              </CardDescription>
            </div>
          </div>
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
