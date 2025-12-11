"use client";

import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    emoji: string;
    description: string;
  };
  onSelect: (templateId: string) => void;
}

export const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
  const t = useTranslations("aiAgents.templates");

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow hover:border-primary/50 flex flex-col">
      <CardHeader className="flex-1">
        <div className="space-y-4">
          {/* Icon and Title in same row */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 flex items-center justify-center w-10 h-10">
              <span className="text-2xl">{template.emoji}</span>
            </div>
            <CardTitle className="text-base font-semibold">
              {template.name}
            </CardTitle>
          </div>

          {/* Description below */}
          <CardDescription className="text-sm">
            {template.description}
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
