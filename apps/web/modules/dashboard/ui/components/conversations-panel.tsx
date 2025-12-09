"use client";

import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { formatDistanceToNow } from "date-fns";
import { getChannelIcon } from "@/lib/channel-utils";
import { api } from "@workspace/backend/_generated/api";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { usePaginatedQuery } from "convex/react";
import { SearchIcon, ListIcon, ArrowRightIcon, ArrowUpIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useAtomValue, useSetAtom } from "jotai/react";
import { statusFilterAtom } from "../../atoms";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";


export const ConversationsPanel = () => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const statusFilter = useAtomValue(statusFilterAtom);
  const setStatusFilter = useSetAtom(statusFilterAtom);

  const conversations = usePaginatedQuery(
    api.private.conversations.getMany,
    {
      status:
        statusFilter === "all"
          ? undefined
          : statusFilter,
    },
    {
      initialNumItems: 10,
    },
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
    isLoadingFirstPage,
  } = useInfiniteScroll({
    status: conversations.status,
    loadMore: conversations.loadMore,
    loadSize: 10,
  });

  const locale = useLocale();

  // Função para obter URL localizada
  const getLocalizedUrl = (path: string) => {
    if (path.startsWith(`/${locale}/`)) {
      return path;
    }
    return `/${locale}${path}`;
  };

  // Filtrar conversas por busca
  const filteredConversations = conversations.results.filter((conversation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conversation.contactSession.name.toLowerCase().includes(query) ||
      conversation.lastMessage?.text?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header com Input de Busca */}
      <div className="flex flex-col gap-3 border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-9"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filtro de Status */}
        <Select
          defaultValue="all"
          onValueChange={(value) => setStatusFilter(
            value as "unresolved" | "escalated" | "resolved" | "all"
          )}
          value={statusFilter}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <ListIcon className="size-3.5" />
                <span>All Status</span>
              </div>
            </SelectItem>
            <SelectItem value="unresolved">
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="size-3.5" />
                <span>Unresolved</span>
              </div>
            </SelectItem>
            <SelectItem value="escalated">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="size-3.5" />
                <span>Escalated</span>
              </div>
            </SelectItem>
            <SelectItem value="resolved">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-3.5" />
                <span>Resolved</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Conversas */}
      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex w-full flex-col">
            {filteredConversations.map((conversation) => {
              const isLastMessageFromOperator =
                conversation.lastMessage?.message?.role !== "user";

              const channelIcon = getChannelIcon(conversation.contactSession.channel);
              const profilePicture = conversation.contactSession.profilePictureUrl;

              const conversationUrl = `/conversations/${conversation._id}`;
              const localizedUrl = getLocalizedUrl(conversationUrl);
              const isActive = pathname === getLocalizedUrl(conversationUrl);

              // Mock: contador de não lidas (futuro: virá do banco)
              const unreadCount = !isLastMessageFromOperator && conversation.status === "unresolved" ? 1 : 0;

              return (
                <Link
                  key={conversation._id}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 border-b px-3 py-3 transition-colors hover:bg-muted/50",
                    isActive && "bg-muted"
                  )}
                  href={localizedUrl}
                >
                  {/* Indicador de conversa ativa */}
                  {isActive && (
                    <div className="absolute top-1/2 left-0 h-12 w-1 -translate-y-1/2 rounded-r-md bg-primary" />
                  )}

                  {/* Avatar com badge do canal */}
                  <DicebearAvatar
                    seed={conversation.contactSession._id}
                    imageUrl={profilePicture}
                    badgeImageUrl={channelIcon}
                    size={40}
                    className="shrink-0"
                  />

                  {/* Conteúdo da conversa */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-sm">
                        {conversation.contactSession.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {formatDistanceToNow(conversation._creationTime, { addSuffix: false })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        "line-clamp-1 flex-1 text-muted-foreground text-xs",
                        unreadCount > 0 && "font-semibold text-foreground"
                      )}>
                        {conversation.lastMessage?.text || "No messages yet"}
                      </p>
                      {/* Badge contador de não lidas */}
                      {unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            <InfiniteScrollTrigger
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              ref={topElementRef}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export const SkeletonConversations = () => {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="w-full">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="flex items-start gap-3 border-b px-3 py-3"
            key={index}
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex w-full items-center justify-between gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};