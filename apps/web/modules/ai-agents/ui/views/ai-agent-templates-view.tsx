"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { TemplateCard } from "../components/template-card";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

export const AIAgentTemplatesView = () => {
  const t = useTranslations("aiAgents");
  const locale = useLocale();
  const router = useRouter();

  const templates = useQuery(api.private.aiAgentTemplates.listActive);

  const handleSelectTemplate = (templateId: string) => {
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
            <h1 className="text-2xl md:text-4xl">
              {t("templates.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("templates.description")}
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {templates === undefined ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {templates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={{
                    id: template.templateId,
                    name: template.name,
                    emoji: template.emoji,
                    description: template.description,
                  }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
