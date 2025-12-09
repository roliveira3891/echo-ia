"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { ConversationsPanel } from "../components/conversations-panel";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export const ConversationsLayout = ({
  children
}: { children: React.ReactNode; }) => {
  const params = useParams();
  const conversationId = params.conversationId;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile: Mostra lista OU conversa (tela cheia)
  if (isMobile) {
    return (
      <div className="flex h-full w-full flex-col">
        {conversationId ? (
          // Mostra apenas a conversa
          <div className="h-full w-full">
            {children}
          </div>
        ) : (
          // Mostra apenas a lista
          <div className="h-full w-full">
            <ConversationsPanel />
          </div>
        )}
      </div>
    );
  }

  // Desktop: Mostra as duas colunas lado a lado
  return (
    <ResizablePanelGroup className="h-full flex-1" direction="horizontal">
      <ResizablePanel defaultSize={30} maxSize={30} minSize={20}>
        <ConversationsPanel />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="h-full" defaultSize={70}>
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
