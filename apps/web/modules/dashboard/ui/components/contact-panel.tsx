"use client";

import Bowser from "bowser";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { getChannelIcon } from "@/lib/channel-utils";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { useQuery } from "convex/react";
import { ClockIcon, GlobeIcon, MailIcon, MonitorIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

type InfoItem = {
  label: string;
  value: string | React.ReactNode;
  className?: string;
};

type InfoSection = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: InfoItem[];
};

export const ContactPanel = () => {
  const params = useParams();
  const conversationId = params.conversationId as (Id<"conversations"> | null);

  const contactSession = useQuery(api.private.contactSessions.getOneByConversationId, 
    conversationId ? {
      conversationId,
    } : "skip",
  );

  const parseUserAgent = useMemo(() => {
    return (userAgent?: string) => {
      if (!userAgent) {
        return { browser: "Unknown", os: "Unknown", device: "Unknown" };
      }

      const browser = Bowser.getParser(userAgent);
      const result = browser.getResult();

      return {
        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || "",
        os: result.os.name || "Unknown",
        osVersion: result.os.version || "",
        device: result.platform.type || "desktop",
        deviceVendor: result.platform.vendor || "",
        deviceModel: result.platform.model || "",
      };
    };
  }, []);

  const userAgentInfo = useMemo(() =>
    parseUserAgent(contactSession?.metadata?.userAgent),
  [contactSession?.metadata?.userAgent, parseUserAgent]);

  const channelIcon = useMemo(() => {
    return getChannelIcon(contactSession?.channel);
  }, [contactSession?.channel]);

  const accordionSections = useMemo<InfoSection[]>(() => {
    if (!contactSession?.metadata) {
      return [];
    }

    return [
      {
        id: "device-info",
        icon: MonitorIcon,
        title: "Device Information",
        items: [
          {
            label: "Browser",
            value:
              userAgentInfo.browser + 
                (userAgentInfo.browserVersion
                  ? ` ${userAgentInfo.browserVersion}`
                  : ""
                ),
          },
          {
            label: "OS",
            value:
              userAgentInfo.os +
                (userAgentInfo.osVersion ? ` ${userAgentInfo.osVersion}` : ""),
          },
          {
            label: "Device",
            value:
              userAgentInfo.device +
                (
                  userAgentInfo.deviceModel
                    ? ` - ${userAgentInfo.deviceModel}`
                    : ""
                ),
              className: "capitalize"
          },
          {
            label: "Screen",
            value: contactSession.metadata.screenResolution,
          },
          {
            label: "Viewport",
            value: contactSession.metadata.viewportSize,
          },
          {
            label: "Cookies",
            value: contactSession.metadata.cookieEnabled ? "Enabled" : "Disabled"
          },
        ],
      },
      {
        id: "location-info",
        icon: GlobeIcon,
        title: "Location & Language",
        items: [
          {
            label: "Language",
            value: contactSession.metadata.language,
          },
          {
            label: "Timezone",
            value: contactSession.metadata.timezone,
          },
          {
            label: "UTC Offset",
            value: contactSession.metadata.timezoneOffset,
          }
        ]
      },
      {
        id: "section-details",
        title: "Section details",
        icon: ClockIcon,
        items: [
          {
            label: "Session Started",
            value: new Date(
              contactSession._creationTime
            ).toLocaleString(),
          }
        ],
      }
    ];
  }, [contactSession, userAgentInfo]);

  if (contactSession === undefined || contactSession === null) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
      {/* Header com Avatar Grande Centralizado */}
      <div className="flex flex-col items-center gap-4 border-b p-6">
        <DicebearAvatar
          seed={contactSession._id}
          imageUrl={contactSession.profilePictureUrl}
          badgeImageUrl={channelIcon}
          size={80}
        />
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="font-semibold text-lg">
            {contactSession.name}
          </h3>
          {contactSession.email && (
            <p className="text-muted-foreground text-sm">
              {contactSession.email}
            </p>
          )}
        </div>
        <Button asChild className="w-full" size="sm">
          <Link href={`mailto:${contactSession.email}`}>
            <MailIcon className="size-4" />
            <span>Send Email</span>
          </Link>
        </Button>
      </div>

      {/* Informações em Cards Simples */}
      <div className="flex-1 space-y-4 p-4">
        {accordionSections.map((section) => (
          <div key={section.id} className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <section.icon className="size-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">{section.title}</h4>
            </div>
            <div className="space-y-3 p-4">
              {section.items.map((item, index) => (
                <div
                  key={`${section.id}-${item.label}-${index}`}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.label}
                  </span>
                  <span className={`text-right font-medium ${item.className || ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Seção de Mídia Compartilhada (preparada para futuro) */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h4 className="font-medium text-sm">Shared Media</h4>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No shared media yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
