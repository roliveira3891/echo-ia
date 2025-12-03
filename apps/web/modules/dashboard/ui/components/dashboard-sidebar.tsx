"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  Mic,
  PaletteIcon,
} from "lucide-react";
import Image from "next/image";
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
import { Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

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
  const { setTheme, theme } = useTheme();
  const t = useTranslations("navigation");

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
    <Sidebar className="group" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <OrganizationSwitcher
                hidePersonal
                skipInvitationScreen
                appearance={{
                  elements: {
                    rootBox: "w-full! h-8!",
                    avatarBox: "size-4! rounded-sm!",
                    organizationSwitcherTrigger: "w-full! justify-start! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
                    organizationPreview: "group-data-[collapsible=icon]:justify-center! gap-2!",
                    organizationPreviewTextContainer: "group-data-[collapsible=icon]:hidden! text-xs! font-medium! text-sidebar-foreground!",
                    organizationSwitcherTriggerIcon: "group-data-[collapsible=icon]:hidden! ml-auto! text-sidebar-foreground!"
                  }
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Customer Support */}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.customerSupport")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerSupportItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className={cn(
                        isActive(item.url) && "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                      )}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon className="size-4" />
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
          <SidebarGroupLabel>{t("sidebar.configuration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className={cn(
                        isActive(item.url) && "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                      )}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon className="size-4" />
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
          <SidebarGroupLabel>{t("sidebar.account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItemsKeys.map((item) => {
                const itemTitle = t(item.titleKey as any);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className={cn(
                        isActive(item.url) && "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                      )}
                      tooltip={itemTitle}
                    >
                      <Link href={getLocalizedUrl(item.url)}>
                        <item.icon className="size-4" />
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

      <SidebarFooter>
        <SidebarMenu>


          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  asChild={false} // importante: não é um Link
                  isActive={false} // vamos controlar o visual manualmente
                  tooltip={t("sidebar.theme")}

                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="size-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span className="group-data-[collapsible=icon]:hidden">
                        {theme === "dark" ? t("sidebar.dark") : theme === "light" ? t("sidebar.light") : t("sidebar.system")}
                      </span>
                    </div>

                    {/* Pequena seta para indicar dropdown (opcional, mas fica bonito) */}
                    <svg
                      className="size-3.5 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7l1.5 1.5L12 16.086l5.5-5.5L19 9z" />
                    </svg>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="start" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                  <Sun className="size-4" />
                  {t("sidebar.light")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                  <Moon className="size-4" />
                  {t("sidebar.dark")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t("sidebar.system")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <UserButton
              showName
              appearance={{
                elements: {
                  rootBox: "w-full! h-8!",
                  userButtonTrigger: "w-full! p-2! hover:bg-sidebar-accent! hover:text-sidebar-accent-foreground! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
                  userButtonBox: "w-full! flex-row-reverse! justify-end! gap-2! group-data-[collapsible=icon]:justify-center! text-sidebar-foreground!",
                  userButtonOuterIdentifier: "pl-0! group-data-[collapsible=icon]:hidden!",
                  avatarBox: "size-4!"
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
