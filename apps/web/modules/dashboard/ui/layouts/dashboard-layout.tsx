import { AuthGuard } from "@/modules/auth/ui/components/auth-guard"
import { OrganizationGuard } from "@/modules/auth/ui/components/organization-guard"
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { DashboardHeader } from "@/modules/dashboard/ui/components/dashboard-header";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { Provider } from "jotai";
import { cookies } from "next/headers";

export const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  // Using SIDEBAR_COOKIE_NAME from sidebar component does not work due to monorepo and SSR
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <AuthGuard>
      <OrganizationGuard>
        <Provider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <DashboardSidebar />
            <main className="flex h-screen w-full flex-1 flex-col overflow-hidden">
              <DashboardHeader />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </Provider>
      </OrganizationGuard>
    </AuthGuard>
  );
};
