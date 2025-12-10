"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { CheckCircle2, AlertCircle, Loader2, QrCode, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Echo IA";

export const EvolutionCard = () => {
  const t = useTranslations("integrations.evolution");
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const connect = useAction(api.public.evolution_oauth.connect);
  const checkStatus = useAction(api.public.evolution_oauth.checkConnectionStatus);
  const disconnect = useAction(api.public.evolution_oauth.disconnect);

  const connection = useQuery(
    api.public.channelConnections.getConnection,
    organization?.id ? { organizationId: organization.id, channel: "evolution" } : "skip"
  );

  const isConnected = connection?.status === "connected";
  const isPending = connection?.status === "pending";

  // Check status when component mounts or connection changes
  useEffect(() => {
    const verifyStatus = async () => {
      // Only verify if we have a connection with an instance name
      if (!connection?.channelMetadata?.instanceName || !organization?.id) {
        return;
      }

      // Skip verification if already connected or if we're showing QR code
      if (connection.status === "connected" || (connection.status === "pending" && qrCode)) {
        return;
      }

      try {
        const result = await checkStatus({
          organizationId: organization.id,
          instanceName: connection.channelMetadata.instanceName,
        });

        // If Evolution API says it's open but our DB shows pending, the status will be updated
        // The connection query will reactively update
        console.log("[Evolution Card] Status check result:", result);
      } catch (err) {
        console.error("[Evolution Card] Failed to verify status:", err);
      }
    };

    // Run verification on mount and when connection changes
    verifyStatus();
  }, [connection?.channelMetadata?.instanceName, connection?.status, organization?.id, qrCode, checkStatus]);

  // Poll for connection status when QR code is displayed
  useEffect(() => {
    if (!isPending || !instanceName || !organization?.id) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const result = await checkStatus({
          organizationId: organization.id,
          instanceName,
        });

        if (result.state === "open") {
          // Connected successfully
          setIsPolling(false);
          setQrCode(null);
          setPairingCode(null);
          setInstanceName(null);
          setOpen(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Failed to check status:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isPending, instanceName, organization?.id, checkStatus]);

  const handleContinue = async () => {
    if (!organization?.id) {
      setError(t("errors.invalidInput"));
      return;
    }

    setShowDisclaimer(false);
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connect({
        organizationId: organization.id,
      });

      if (result.qrcode) {
        setQrCode(result.qrcode);
        setPairingCode(result.pairingCode);
        setInstanceName(result.instanceName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.connectionFailed"));
      setQrCode(null);
      setPairingCode(null);
      setShowDisclaimer(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;

    setIsConnecting(true);
    try {
      await disconnect({ organizationId: organization.id });
      setQrCode(null);
      setPairingCode(null);
      setInstanceName(null);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const resetDialog = () => {
    setOpen(false);
    setShowDisclaimer(true);
    setError(null);
    setQrCode(null);
    setPairingCode(null);
    setInstanceName(null);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Image
                alt="Evolution API"
                height={50}
                src="/channels/evolution.svg"
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
        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900 mb-1">
                {t("connectedInstance")}: {connection?.channelMetadata?.instanceName}
              </p>
              <p className="text-xs text-green-700">
                {t("status")}: {connection?.channelMetadata?.connectionState}
              </p>
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={isConnecting}
              variant="outline"
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("disconnecting")}
                </>
              ) : (
                t("disconnect")
              )}
            </Button>
          </div>
        ) : isPending ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                {t("pendingConnection")}
              </p>
              <p className="text-xs text-yellow-700">
                {t("pendingConnectionDescription")}
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <QrCode className="h-4 w-4" />
                  {t("reconnect")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {showDisclaimer ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        {t("disclaimer.title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("disclaimer.subtitle")}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="rounded-lg bg-yellow-50 border-2 border-yellow-200 p-4">
                        <p className="text-sm text-yellow-900 mb-4">
                          {t("disclaimer.warning", { appName: APP_NAME })}
                        </p>
                        <ul className="space-y-2 text-sm text-yellow-800 ml-4 list-disc">
                          <li>{t("disclaimer.point1")}</li>
                          <li>{t("disclaimer.point2")}</li>
                          <li>{t("disclaimer.point3")}</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleContinue}
                          disabled={isConnecting}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("connecting")}
                            </>
                          ) : (
                            t("disclaimer.continue")
                          )}
                        </Button>
                        <Button
                          onClick={resetDialog}
                          variant="outline"
                          disabled={isConnecting}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-6 w-6" />
                        {t("qrcode.title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("qrcode.description")}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {qrCode ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2">
                          <Image
                            src={`${qrCode}`}
                            alt="QR Code"
                            width={300}
                            height={300}
                            className="rounded-lg"
                          />
                          
                        </div>
                      ) : pairingCode ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                          <div className="mb-4 p-4 bg-white rounded-full shadow-md">
                            <QrCode className="h-12 w-12 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {t("qrcode.usePairingCode")}
                          </p>
                          <div className="bg-white px-6 py-4 rounded-lg shadow-sm border-2 border-green-300">
                            <p className="text-3xl font-mono font-bold tracking-widest text-green-700">
                              {pairingCode}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-4 max-w-md text-center">
                            {t("qrcode.pairingCodeInstructions")}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                          <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
                          <p className="text-sm text-gray-600">
                            {t("qrcode.generating")}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          {t("qrcode.instructions")}
                        </p>
                        <ol className="space-y-1 text-sm text-blue-900 ml-4 list-decimal">
                          <li>{t("qrcode.step1")}</li>
                          <li>{t("qrcode.step2")}</li>
                          <li>{t("qrcode.step3")}</li>
                        </ol>
                      </div>

                      {isPolling && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("qrcode.waiting")}
                        </div>
                      )}

                      <Button
                        onClick={resetDialog}
                        variant="outline"
                        className="w-full"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("unofficial")}
              </p>
              <p className="text-xs">
                {t("unofficialWarning")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("notConnected")}
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <QrCode className="h-4 w-4" />
                  {t("connect")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {showDisclaimer ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        {t("disclaimer.title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("disclaimer.subtitle")}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="rounded-lg bg-yellow-50 border-2 border-yellow-200 p-4">
                        <p className="text-sm text-yellow-900 mb-4">
                          {t("disclaimer.warning", { appName: APP_NAME })}
                        </p>
                        <ul className="space-y-2 text-sm text-yellow-800 ml-4 list-disc">
                          <li>{t("disclaimer.point1")}</li>
                          <li>{t("disclaimer.point2")}</li>
                          <li>{t("disclaimer.point3")}</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleContinue}
                          disabled={isConnecting}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("connecting")}
                            </>
                          ) : (
                            t("disclaimer.continue")
                          )}
                        </Button>
                        <Button
                          onClick={resetDialog}
                          variant="outline"
                          disabled={isConnecting}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-6 w-6" />
                        {t("qrcode.title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("qrcode.description")}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {qrCode ? (
                        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2">
                          <Image
                            src={`${qrCode}`}
                            alt="QR Code"
                            width={300}
                            height={300}
                            className="rounded-lg"
                          />

                        </div>
                      ) : pairingCode ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                          <div className="mb-4 p-4 bg-white rounded-full shadow-md">
                            <QrCode className="h-12 w-12 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {t("qrcode.usePairingCode")}
                          </p>
                          <div className="bg-white px-6 py-4 rounded-lg shadow-sm border-2 border-green-300">
                            <p className="text-3xl font-mono font-bold tracking-widest text-green-700">
                              {pairingCode}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-4 max-w-md text-center">
                            {t("qrcode.pairingCodeInstructions")}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
                          <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
                          <p className="text-sm text-gray-600">
                            {t("qrcode.generating")}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          {t("qrcode.instructions")}
                        </p>
                        <ol className="space-y-1 text-sm text-blue-900 ml-4 list-decimal">
                          <li>{t("qrcode.step1")}</li>
                          <li>{t("qrcode.step2")}</li>
                          <li>{t("qrcode.step3")}</li>
                        </ol>
                      </div>

                      {isPolling && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("qrcode.waiting")}
                        </div>
                      )}

                      <Button
                        onClick={resetDialog}
                        variant="outline"
                        className="w-full"
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
              <p className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("unofficial")}
              </p>
              <p className="text-xs">
                {t("unofficialWarning")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
