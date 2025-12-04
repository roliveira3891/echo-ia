"use client";

import { useOrganization } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { IntegrationId, INTEGRATIONS } from "../../constants";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useState } from "react";
import { createScript } from "../../utils";
import { WhatsAppCard } from "../components/whatsapp-card";
import { InstagramCard } from "../components/instagram-card";
import { TikTokCard } from "../components/tiktok-card";
import { TelegramCard } from "../components/telegram-card";
import { FacebookMessengerCard } from "../components/facebook-messenger-card";
import { LinkedInCard } from "../components/linkedin-card";

export const IntegrationsView = () => {
  const t = useTranslations("integrations");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const { organization } = useOrganization();

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found");
      return;
    }

    const snippet = createScript(integrationId, organization.id);
    setSelectedSnippet(snippet);
    setDialogOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization?.id ?? "");
      toast.success(t("copiedToClipboard"));
    } catch {
      toast.error(t("failedToCopy"));
    }
  };

  return (
    <>
      <IntegrationsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={selectedSnippet}
      />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Label className="w-34" htmlFor="organization-id">
                {t("organizationId")}
              </Label>
              <Input
                disabled
                id="organization-id"
                readOnly
                value={organization?.id ?? ""}
                className="flex-1 bg-background font-mono text-sm"
              />
              <Button
                className="gap-2"
                onClick={handleCopy}
                size="sm"
              >
                <CopyIcon className="size-4" />
                {t("copy")}
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Channel Integrations */}
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-lg">{t("channelIntegrations")}</Label>
              <p className="text-muted-foreground text-sm">
                {t("channelIntegrationsDesc")}
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <TelegramCard />
              <WhatsAppCard />
              <InstagramCard />
              <TikTokCard />
              <FacebookMessengerCard />
              <LinkedInCard />
            </div>
          </div>

          <Separator className="my-8" />

          {/* Widget Integrations */}
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-lg">{t("websiteWidget")}</Label>
              <p className="text-muted-foreground text-sm">
                {t("websiteWidgetDesc")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleIntegrationClick(integration.id)}
                  type="button"
                  className="flex items-center gap-4 rounded-lg border bg-background p-4 hover:bg-accent"
                >
                  <Image
                    alt={integration.title}
                    height={32}
                    src={integration.icon}
                    width={32}
                  />
                  <p>{integration.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const IntegrationsDialog = ({
  open,
  onOpenChange,
  snippet,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  snippet: string;
}) => {
  const t = useTranslations("integrations");
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(t("copiedToClipboard"));
    } catch {
      toast.error(t("failedToCopy"));
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("integrateWithYourWebsite")}</DialogTitle>
          <DialogDescription>
            {t("followSteps")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              {t("copyCode")}
            </div>
            <div className="group relative">
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-foreground p-2 font-mono text-secondary text-sm">
                {snippet}
              </pre>
              <Button
                className="absolute top-4 right-6 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleCopy}
                size="icon"
                variant="secondary"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              {t("addCodeToPage")}
            </div>
            <p className="text-muted-foreground text-sm">
              {t("pasteCodeDesc")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
