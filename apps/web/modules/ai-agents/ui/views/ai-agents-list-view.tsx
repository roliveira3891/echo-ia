"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AgentCard } from "../components/agent-card";
import { MOCK_AGENTS } from "../../lib/mock-data";
import { toast } from "sonner";

export const AIAgentsListView = () => {
  const t = useTranslations("aiAgents");
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
            <Link href="/ai-agents/new/templates">
              <Plus className="h-4 w-4" />
              {t("createNewAgent")}
            </Link>
          </Button>
        </div>

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
                  <Link href="/ai-agents/new/templates">
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
