"use client";

import { useOrganization } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { toast } from "sonner";
import Image from "next/image";

export const WhatsAppCard = () => {
  const t = useTranslations("integrations.whatsapp");
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Query to get current WhatsApp account status
  const whatsappAccount = useQuery(
    api.public.whatsappAccounts.getAccount,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  // Action to get OAuth authorization URL
  const getAuthUrl = useAction(
    api.public.whatsapp_oauth.getAuthorizationUrl
  );

  // Action to disconnect WhatsApp
  const disconnectWhatsApp = useAction(
    api.public.whatsapp_oauth.disconnect
  );

  // Monitor popup window and refresh when oauth completes
  useEffect(() => {
    if (!popupWindow || popupWindow.closed) {
      return;
    }

    const interval = setInterval(() => {
      try {
        // Check if popup was closed
        if (popupWindow.closed) {
          clearInterval(interval);
          setPopupWindow(null);
          // Refresh the account status after popup closes
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (e) {
        // Ignore cross-origin errors
      }
    }, 500);

    return () => clearInterval(interval);
  }, [popupWindow]);

  const handleConnect = async () => {
    if (!organization) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsLoading(true);
      const { authorizationUrl } = await getAuthUrl({
        organizationId: organization.id,
      });

      // Open popup window for OAuth
      const popup = window.open(
        authorizationUrl,
        "WhatsApp OAuth",
        "width=600,height=700,left=200,top=100"
      );

      if (!popup) {
        toast.error(t("initiatingConnectionPopup"));
        return;
      }

      setPopupWindow(popup);
    } catch (error) {
      toast.error(t("initiatingConnection"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsLoading(true);
      await disconnectWhatsApp({
        organizationId: organization.id,
      });
      toast.success("WhatsApp account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect WhatsApp");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = whatsappAccount?.isActive;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Image
                alt="WhatsApp"
                height={50}
                src="/channels/whatsapp.svg"
                width={50}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              <CardDescription>
                {t("description")}
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("connected")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected && whatsappAccount ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("connectedPhone")}
              </p>
              <p className="font-mono text-lg font-semibold">
                {whatsappAccount.phoneNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("connectedOn")} {new Date(whatsappAccount.connectedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>✅ {t("active")}</p>
              <p>{t("receiving")}</p>
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="outline"
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("disconnecting")}
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  {t("disconnect")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t("description2")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("comingSoonMsg")}
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isLoading || !organization}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("disconnecting")}
                </>
              ) : (
                <>
                  {/* <Image
                    alt="WhatsApp"
                    height={16}
                    src="/whatsapp-logo-white.svg"
                    width={16}
                  /> */}
                  {t("connect")}
                </>
              )}
            </Button>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-medium mb-2">{t("requirements")}</p>
              <ul className="space-y-1 text-xs ml-4 list-disc">
                {t.raw("requirementsList").map((requirement: string) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
