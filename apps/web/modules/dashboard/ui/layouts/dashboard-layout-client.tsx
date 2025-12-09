"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

export const DashboardLayoutClient = ({ children, sidebar, header }: DashboardLayoutClientProps) => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Detecta se está numa conversa específica (não só na lista)
  const isInConversation = pathname.includes("/conversations/") && pathname.split("/").length > 3;

  // No mobile, quando está numa conversa específica, esconde sidebar e header
  if (isMobile && isInConversation) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  // Renderização normal (mostra sidebar e header)
  return (
    <>
      {sidebar}
      <main className="flex h-screen w-full flex-1 flex-col overflow-hidden">
        {header}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </>
  );
};
