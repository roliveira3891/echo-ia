"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import {
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  Mic,
  PaletteIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { useTheme } from "next-themes";

import { useLocale, useTranslations } from "next-intl";

const customerSupportItemsKeys = [
  {
    titleKey: "sidebar.conversations",
    url: "/conversations",
    icon: InboxIcon,
  },
  {
    titleKey: "sidebar.knowledgeBase",
    url: "/files",
    icon: LibraryBigIcon,
  },
];

const configurationItemsKeys = [
  {
    titleKey: "sidebar.widgetCustomization",
    url: "/customization",
    icon: PaletteIcon,
  },
  {
    titleKey: "sidebar.integrations",
    url: "/integrations",
    icon: LayoutDashboardIcon,
  },
  {
    titleKey: "sidebar.voiceAssistant",
    url: "/plugins/vapi",
    icon: Mic,
  },
];

const accountItemsKeys = [
  {
    titleKey: "sidebar.plansBilling",
    url: "/billing",
    icon: CreditCardIcon,
  }
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const { theme } = useTheme();

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(url);
  };

  const locale = useLocale();

  const getLocalizedUrl = (url: string) => {
    // Verifica se a URL já contém o locale, se não, adiciona
    if (url.startsWith(`/${locale}/`)) {
      return url;
    }
    return `/${locale}${url}`;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5">
              <OrganizationSwitcher
                hidePersonal
                skipInvitationScreen
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                  elements: {
                    rootBox: "w-full! relative! z-[100]!",
                    avatarBox: "size-5! rounded-md!",
                    organizationSwitcherTrigger: "w-full! justify-start! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent! transition-colors! rounded-md!",
                    organizationPreview: "group-data-[collapsible=icon]:justify-center! gap-2.5!",
                    organizationPreviewTextContainer: "group-data-[collapsible=icon]:hidden! text-sm! font-semibold! text-sidebar-foreground!",
                    organizationSwitcherTriggerIcon: "group-data-[collapsible=icon]:hidden! ml-auto! text-sidebar-foreground/60!",
                    organizationSwitcherPopoverCard: "!z-[200] !pointer-events-auto",
                    organizationSwitcherPopoverActionButton: "!z-[200] !pointer-events-auto",
                    organizationSwitcherPopoverActions: "!pointer-events-auto",
                  }
                }}
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Customer Support */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60">
            {t("sidebar.customerSupport")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerSupportItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon />
                        <span>{itemTitle}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60">
            {t("sidebar.configuration")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon />
                        <span>{itemTitle}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60">
            {t("sidebar.account")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon />
                        <span>{itemTitle}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              showName
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  rootBox: "w-full! relative! z-[100]!",
                  userButtonTrigger: "w-full! p-2! hover:bg-sidebar-accent! transition-colors! group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2! rounded-md!",
                  userButtonBox: "w-full! flex-row-reverse! justify-end! gap-2.5! group-data-[collapsible=icon]:justify-center! text-sidebar-foreground!",
                  userButtonOuterIdentifier: "pl-0! group-data-[collapsible=icon]:hidden! text-sm! font-medium!",
                  avatarBox: "size-8! rounded-md!",
                  userButtonPopoverCard: "!z-[200] !pointer-events-auto",
                  userButtonPopoverActionButton: "!z-[200] !pointer-events-auto",
                  userButtonPopoverActions: "!pointer-events-auto"
                }
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
