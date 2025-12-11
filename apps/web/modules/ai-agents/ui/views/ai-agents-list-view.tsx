"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Plus, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "../components/agent-card";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";

export const AIAgentsListView = () => {
  const t = useTranslations("aiAgents");
  const locale = useLocale();

  const agents = useQuery(api.private.aiAgents.list);
  const toggleActive = useMutation(api.private.aiAgents.toggleActive);
  const deleteAgent = useMutation(api.private.aiAgents.deleteAgent);
  const setAsDefault = useMutation(api.private.aiAgents.setAsDefault);

  const handleToggleActive = async (agentId: string, isActive: boolean) => {
    try {
      await toggleActive({ id: agentId as Id<"aiAgents"> });
      toast.success(isActive ? t("agentActivated") : t("agentDeactivated"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleDelete = async (agentId: string) => {
    if (confirm(t("confirmDelete"))) {
      try {
        await deleteAgent({ id: agentId as Id<"aiAgents"> });
        toast.success(t("agentDeleted"));
      } catch (error) {
        toast.error(t("error"));
      }
    }
  };

  const handleSetAsDefault = async (agentId: string) => {
    try {
      await setAsDefault({ id: agentId as Id<"aiAgents"> });
      toast.success(t("setAsDefaultSuccess"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const defaultAgent = agents?.find((agent) => agent.isDefault);

  return (
    <div className="flex min-h-screen flex-col bg-muted p-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <Button asChild className="gap-2">
            <Link href={`/${locale}/ai-agents/new/templates`}>
              <Plus className="h-4 w-4" />
              {t("createNewAgent")}
            </Link>
          </Button>
        </div>

        <Separator className="my-5" />

        {/* Default Agent Banner */}
        {defaultAgent && (
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 flex items-center justify-center">
                  <span className="text-3xl">{defaultAgent.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{defaultAgent.name}</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {t("default")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("defaultAgentDescription")}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/ai-agents/${defaultAgent._id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("edit")}
                </Link>
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Agents Grid */}
        <div className="space-y-6">
          <div className="space-y-1">
            <Label className="text-lg">{t("agentsListTitle")}</Label>
            <p className="text-muted-foreground text-sm">
              {t("agentsListDescription")}
            </p>
          </div>
          {agents === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-12 text-center">
              <div className="mx-auto max-w-md space-y-4">
                <div className="text-6xl">🤖</div>
                <h3 className="text-lg font-semibold">{t("noAgents")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("noAgentsDescription")}
                </p>
                <Button asChild className="gap-2">
                  <Link href={`/${locale}/ai-agents/new/templates`}>
                    <Plus className="h-4 w-4" />
                    {t("createFirstAgent")}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent._id}
                  agent={{
                    _id: agent._id,
                    name: agent.name,
                    description: agent.description || "",
                    icon: agent.emoji,
                    isActive: agent.isActive,
                    isDefault: agent.isDefault,
                    conversations: 0,
                  } as any}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  onSetAsDefault={handleSetAsDefault}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
