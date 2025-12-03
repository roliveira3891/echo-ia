"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

export const TikTokCard = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-black p-2">
              <Image
                alt="TikTok"
                height={24}
                src="/tiktok-logo.svg"
                width={24}
              />
            </div>
            <div>
              <CardTitle className="text-lg">TikTok Shop</CardTitle>
              <CardDescription>
                Connect your TikTok Shop account
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Connect your TikTok Shop account to receive customer inquiries and provide support.
            </p>
            <p className="text-xs text-muted-foreground">
              This integration is coming soon. Stay tuned!
            </p>
          </div>

          <Button
            disabled
            className="w-full gap-2 bg-black hover:bg-gray-900"
          >
            <Image
              alt="TikTok"
              height={16}
              src="/tiktok-logo-white.svg"
              width={16}
            />
            Connect TikTok
          </Button>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium mb-2">Requirements:</p>
            <ul className="space-y-1 text-xs ml-4 list-disc">
              <li>TikTok Shop account</li>
              <li>Admin access to shop</li>
              <li>TikTok Business Account</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
