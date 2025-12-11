"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getTemplateById, getAgentById, MOCK_TEMPLATES } from "../../lib/mock-data";

interface AIAgentFormData {
  name: string;
  iconName: string;
  instructions: string;
}

export const AIAgentConfigureView = () => {
  const t = useTranslations("aiAgents.configure");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const templateId = searchParams?.get("template");
  const agentId = params?.agentId as string | undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AIAgentFormData>({
    name: "",
    iconName: "Bot",
    instructions: "",
  });

  // Determine if we're in edit mode or create mode
  const isEditMode = !!agentId;

  // Load data: either from existing agent (edit mode) or from template (create mode)
  useEffect(() => {
    if (isEditMode && agentId) {
      // Edit mode: load existing agent data
      const agent = getAgentById(agentId);
      if (agent) {
        setFormData({
          name: agent.name,
          iconName: agent.icon.name || "Bot",
          instructions: agent.instructions,
        });
      } else {
        toast.error("Agente não encontrado");
        router.push(`/${locale}/ai-agents`);
      }
    } else if (templateId) {
      // Create mode: load template data
      const template = getTemplateById(templateId as any);
      if (template) {
        setFormData({
          name: template.name,
          iconName: template.icon.name || "Bot",
          instructions: template.instructions,
        });
      }
    }
  }, [agentId, templateId, isEditMode, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!formData.instructions.trim()) {
      toast.error(t("instructionsRequired"));
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call backend mutation to create/update agent
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      if (isEditMode) {
        toast.success(t("agentUpdated"));
      } else {
        toast.success(t("agentCreated"));
      }
      router.push(`/${locale}/ai-agents`);
    } catch (error) {
      if (isEditMode) {
        toast.error(t("errorUpdating"));
      } else {
        toast.error(t("errorCreating"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted p-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" asChild className="gap-2">
            <Link href={isEditMode ? `/${locale}/ai-agents` : `/${locale}/ai-agents/new/templates`}>
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">
              {isEditMode ? t("editTitle") : t("title")}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? t("editDescription") : t("description")}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("configuration")}</CardTitle>
              <CardDescription>
                {t("configurationDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("nameHint")}
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">{t("instructions")}</Label>
                <Textarea
                  id="instructions"
                  placeholder={t("instructionsPlaceholder")}
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("instructionsHint")}</span>
                  <span>
                    {formData.instructions.length} / 10000 {t("characters")}
                  </span>
                </div>
              </div>

              {/* Learn More Link */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>{t("tip")}:</strong> {t("tipDescription")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Sources Section (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>{t("knowledgeSources")}</CardTitle>
              <CardDescription>
                {t("knowledgeSourcesDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("knowledgeSourcesPlaceholder")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("knowledgeSourcesHint")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/ai-agents`)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("save")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
