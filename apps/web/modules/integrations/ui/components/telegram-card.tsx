"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";

export const TelegramCard = () => {
  const t = useTranslations("integrations.telegram");
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useAction(api.public.telegram_oauth.connect);
  const disconnect = useAction(api.public.telegram_oauth.disconnect);

  const connection = useQuery(
    api.public.channelConnections.getConnection,
    organization?.id ? { organizationId: organization.id, channel: "telegram" } : "skip"
  );

  const isConnected = connection?.status === "connected";

  const handleConnect = async () => {
    if (!organization?.id || !botToken.trim()) {
      setError("Please enter a valid bot token");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connect({
        organizationId: organization.id,
        botToken: botToken.trim(),
      });

      // Success - close dialog and reset
      setOpen(false);
      setBotToken("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect. Please check your bot token.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;

    setIsConnecting(true);
    try {
      await disconnect({ organizationId: organization.id });
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-300 p-2">
              <Image
                alt="Telegram"
                height={50}
                src="/channels/telegram.svg"
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
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("connected")}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900 mb-1">
                {t("connectedBot")}: @{connection?.channelMetadata?.botUsername}
              </p>
              <p className="text-xs text-green-700">
                {connection?.channelMetadata?.botName}
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
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("description2")}
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-blue-500 hover:bg-blue-600">
                  {t("connect")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Image
                        alt="Telegram"
                        height={32}
                        width={32}
                        src="/channels/telegram.svg"
                      />
                    </div>
                    {t("connectTitle")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("connectDescription")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Step-by-step instructions */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="font-semibold text-sm mb-3 text-blue-900">
                      {t("stepsTitle")}
                    </h4>
                    <ol className="space-y-2 text-sm text-blue-900">
                      <li className="flex gap-2">
                        <span className="font-bold">1.</span>
                        <span>{t("step1")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">2.</span>
                        <span>{t("step2")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">3.</span>
                        <span>{t("step3")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">4.</span>
                        <span>{t("step4")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold">5.</span>
                        <span>{t("step5")}</span>
                      </li>
                    </ol>

                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t("openTelegram")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Token input */}
                  <div className="space-y-2">
                    <Label htmlFor="bot-token">{t("tokenLabel")}</Label>
                    <Input
                      id="bot-token"
                      type="text"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={botToken}
                      onChange={(e) => {
                        setBotToken(e.target.value);
                        setError(null);
                      }}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("tokenHint")}
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting || !botToken.trim()}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("validating")}
                        </>
                      ) : (
                        t("connectButton")}
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        setBotToken("");
                        setError(null);
                      }}
                      variant="outline"
                      disabled={isConnecting}
                    >
                      {t("cancel")}
                    </Button>
                  </div>

                  {/* Security notice */}
                  <p className="text-xs text-center text-muted-foreground">
                    {t("securityNotice")}
                  </p>
                </div>
              </DialogContent>
            </Dialog>

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
