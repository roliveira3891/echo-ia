"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "../components/agent-card";
import { MOCK_AGENTS } from "../../lib/mock-data";
import { toast } from "sonner";

export const AIAgentsListView = () => {
  const t = useTranslations("aiAgents");
  const locale = useLocale();
  const [agents, setAgents] = useState(MOCK_AGENTS);

  const handleToggleActive = (agentId: string, isActive: boolean) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent._id === agentId ? { ...agent, isActive } : agent
      )
    );
    toast.success(
      isActive ? t("agentActivated") : t("agentDeactivated")
    );
  };

  const handleDelete = (agentId: string) => {
    if (confirm(t("confirmDelete"))) {
      setAgents((prev) => prev.filter((agent) => agent._id !== agentId));
      toast.success(t("agentDeleted"));
    }
  };

  const handleSetAsDefault = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => ({
        ...agent,
        isDefault: agent._id === agentId,
      }))
    );
    toast.success(t("setAsDefaultSuccess"));
  };

  const defaultAgent = agents.find((agent) => agent.isDefault);

  return (
    <div className="flex min-h-screen flex-col bg-muted p-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{t("title")}</h1>
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

        {/* Default Agent Banner */}
        {defaultAgent && (
          <div className="mt-8 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  {(() => {
                    const Icon = defaultAgent.icon;
                    return <Icon className="h-6 w-6 text-primary" />;
                  })()}
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

        {/* Agents Grid */}
        <div className="mt-8">
          {agents.length === 0 ? (
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
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent._id}
                  agent={agent}
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
