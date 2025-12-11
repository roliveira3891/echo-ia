"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { TemplateCard } from "../components/template-card";
import { MOCK_TEMPLATES } from "../../lib/mock-data";

export const AIAgentTemplatesView = () => {
  const t = useTranslations("aiAgents");
  const locale = useLocale();
  const router = useRouter();

  const handleSelectTemplate = (templateId: string) => {
    // Navigate to configure page with template selected
    router.push(`/${locale}/ai-agents/new/configure?template=${templateId}`);
  };

  const handleCreateFromScratch = () => {
    router.push(`/${locale}/ai-agents/new/configure`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted p-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" asChild className="gap-2">
            <Link href={`/${locale}/ai-agents`}>
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">
              {t("templates.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("templates.description")}
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelectTemplate}
            />
          ))}

          {/* Create from Scratch Option */}
          <Card className="overflow-hidden border-2 border-dashed hover:shadow-md transition-shadow hover:border-primary/50 flex flex-col">
            <CardHeader className="flex-1">
              <div className="space-y-4">
                {/* Icon and Title in same row */}
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {t("templates.scratch.name")}
                  </CardTitle>
                </div>

                {/* Description below */}
                <CardDescription className="text-sm">
                  {t("templates.scratch.description")}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <Button
                onClick={handleCreateFromScratch}
                className="w-full"
                variant="outline"
              >
                {t("templates.startFresh")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
