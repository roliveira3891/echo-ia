"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import type { AIAgent } from "../../lib/mock-data";

interface AgentCardProps {
  agent: AIAgent;
  onToggleActive?: (agentId: string, isActive: boolean) => void;
  onDelete?: (agentId: string) => void;
}

export const AgentCard = ({ agent, onToggleActive, onDelete }: AgentCardProps) => {
  const t = useTranslations("aiAgents");
  const [isActive, setIsActive] = useState(agent.isActive);

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    onToggleActive?.(agent._id, newState);
  };

  const resolutionRate = agent.stats?.resolutionRate || 0;
  const totalConversations = agent.stats?.totalConversations || 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{agent.emoji}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{agent.name}</h3>
                {isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    ● {t("active")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                    ○ {t("inactive")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t(`templates.${agent.templateType}.name`)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/ai-agents/${agent._id}/edit`} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  {t("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(agent._id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{totalConversations}</p>
            <p className="text-xs text-muted-foreground">{t("totalConversations")}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-green-600">{resolutionRate}%</p>
            <p className="text-xs text-muted-foreground">{t("resolutionRate")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              id={`active-${agent._id}`}
            />
            <label
              htmlFor={`active-${agent._id}`}
              className="text-sm font-medium cursor-pointer"
            >
              {isActive ? t("active") : t("inactive")}
            </label>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/ai-agents/${agent._id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {t("edit")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
