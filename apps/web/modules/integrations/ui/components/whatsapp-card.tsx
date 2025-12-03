"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { toast } from "sonner";
import Image from "next/image";

export const WhatsAppCard = () => {
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  // Query to get current WhatsApp account status
  const whatsappAccount = useQuery(
    api.system.providers.whatsappOAuth.getAccount,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  // Action to get OAuth authorization URL
  const getAuthUrl = useMutation(
    api.system.providers.whatsappOAuth.getAuthorizationUrl
  );

  // Action to disconnect WhatsApp
  const disconnectWhatsApp = useMutation(
    api.system.providers.whatsappOAuth.disconnect
  );

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

      // Redirect to Meta OAuth
      window.location.href = authorizationUrl;
    } catch (error) {
      toast.error("Failed to initiate WhatsApp connection");
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
                height={24}
                src="/whatsapp-logo.svg"
                width={24}
              />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp Business</CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account via Meta
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected && whatsappAccount ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Connected Phone Number
              </p>
              <p className="font-mono text-lg font-semibold">
                {whatsappAccount.phoneNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Connected on {new Date(whatsappAccount.connectedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>✅ Your WhatsApp Business account is active and ready to receive messages.</p>
              <p>Messages from customers will be automatically processed by your AI assistant.</p>
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
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Disconnect WhatsApp
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click below to connect your WhatsApp Business account using Meta Embedded Signup.
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll be redirected to Meta to authorize the connection.
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
                  Connecting...
                </>
              ) : (
                <>
                  <Image
                    alt="WhatsApp"
                    height={16}
                    src="/whatsapp-logo-white.svg"
                    width={16}
                  />
                  Connect WhatsApp
                </>
              )}
            </Button>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="space-y-1 text-xs ml-4 list-disc">
                <li>Meta Business Account</li>
                <li>WhatsApp Business Account verified</li>
                <li>Phone number associated with Business Account</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
