"use client";

import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useAction, useMutation, useQuery } from "convex/react";
import { MoreHorizontalIcon, Wand2Icon, SendIcon, PaperclipIcon, SmileIcon, CheckCheckIcon, ChevronLeftIcon } from "lucide-react";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input";
import { Form, FormField } from "@workspace/ui/components/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { ConversationStatusButton } from "../components/conversation-status-button";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "sonner";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { getChannelIcon } from "@/lib/channel-utils";
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

// Helper para agrupar mensagens por data
const groupMessagesByDate = (messages: any[]) => {
  const groups: { date: Date; label: string; messages: any[] }[] = [];

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp || Date.now());
    const existingGroup = groups.find(g => isSameDay(g.date, messageDate));

    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      let label = format(messageDate, "MMMM dd, yyyy");
      if (isToday(messageDate)) {
        label = "Today";
      } else if (isYesterday(messageDate)) {
        label = "Yesterday";
      }

      groups.push({
        date: messageDate,
        label,
        messages: [message],
      });
    }
  });

  return groups;
};

export const ConversationIdView = ({
  conversationId,
}: {
  conversationId: Id<"conversations">,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBackToList = () => {
    router.push(`/${locale}/conversations`);
  };

  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  });

  const contactSession = useQuery(
    api.private.contactSessions.getOneByConversationId,
    conversation ? { conversationId } : "skip"
  );

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 10, }
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
  } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 10,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const enhanceResponse = useAction(api.private.messages.enhanceResponse);
  const handleEnhanceResponse = async () => {
    setIsEnhancing(true);
    const currentValue = form.getValues("message");

    try {
      const response = await enhanceResponse({ prompt: currentValue });

      form.setValue("message", response);
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsEnhancing(false);
    }
  }

  const createMessage = useMutation(api.private.messages.create);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createMessage({
        conversationId,
        prompt: values.message,
      });

      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const updateConversationStatus = useMutation(api.private.conversations.updateStatus);
  const handleToggleStatus = async () => {
    if (!conversation) {
      return;
    }

    setIsUpdatingStatus(true);

    let newStatus: "unresolved" | "resolved" | "escalated";

    // Cycle through states: unresolved -> escalated -> resolved -> unresolved
    if (conversation.status === "unresolved") {
      newStatus = "escalated";
    } else if (conversation.status === "escalated") {
      newStatus = "resolved"
    } else {
      newStatus = "unresolved"
    }

    try {
      await updateConversationStatus({
        conversationId,
        status: newStatus,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const channelIcon = useMemo(() => {
    return getChannelIcon(contactSession?.channel);
  }, [contactSession?.channel]);

  const messageGroups = useMemo(() => {
    const uiMessages = toUIMessages(messages.results ?? []) ?? [];
    return groupMessagesByDate(uiMessages);
  }, [messages.results]);

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header com Avatar e Nome */}
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Botão Voltar - Apenas Mobile */}
          {isMobile && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBackToList}
              className="h-9 w-9 p-0"
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
          )}

          <DicebearAvatar
            seed={contactSession?._id ?? "user"}
            imageUrl={contactSession?.profilePictureUrl}
            badgeImageUrl={channelIcon}
            size={40}
          />
          <div className="flex flex-col">
            <h2 className="font-semibold text-sm">
              {contactSession?.name ?? "Loading..."}
            </h2>
            <p className="text-muted-foreground text-xs">
              {contactSession?.email ?? ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!!conversation && (
            <ConversationStatusButton
              onClick={handleToggleStatus}
              status={conversation.status}
              disabled={isUpdatingStatus}
            />
          )}
          <Button size="sm" variant="ghost">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </div>
      </header>

      {/* Área de Mensagens */}
      <AIConversation className="flex-1">
        <AIConversationContent className="px-4">
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />

          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Separador de Data */}
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                  {group.label}
                </div>
              </div>

              {/* Mensagens do Grupo */}
              {group.messages.map((message) => {
                const isUser = message.role === "user";
                const messageTime = format(new Date(message.timestamp || Date.now()), "HH:mm");

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-2",
                      !isUser && "flex-row-reverse"
                    )}
                  >
                    {/* Avatar (só para mensagens do usuário) */}
                    {isUser && (
                      <DicebearAvatar
                        seed={contactSession?._id ?? "user"}
                        imageUrl={contactSession?.profilePictureUrl}
                        size={32}
                        className="shrink-0"
                      />
                    )}

                    {/* Bubble da Mensagem */}
                    <div
                      className={cn(
                        "flex max-w-[70%] flex-col gap-1",
                        !isUser && "items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          isUser
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 text-muted-foreground text-xs",
                          !isUser && "flex-row-reverse"
                        )}
                      >
                        <span>{messageTime}</span>
                        {!isUser && (
                          <CheckCheckIcon className="size-3 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      {/* Input de Mensagem */}
      <div className="shrink-0 border-t bg-background p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-end gap-2">
            <div className="flex flex-1 flex-col gap-2 rounded-lg border bg-background">
              <FormField
                control={form.control}
                disabled={conversation?.status === "resolved"}
                name="message"
                render={({ field }) => (
                  <textarea
                    {...field}
                    disabled={
                      conversation?.status === "resolved" ||
                      form.formState.isSubmitting ||
                      isEnhancing
                    }
                    className="min-h-[44px] max-h-32 w-full resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                    placeholder={
                      conversation?.status === "resolved"
                        ? "This conversation has been resolved"
                        : "Type a message..."
                    }
                    rows={1}
                  />
                )}
              />
              <div className="flex items-center justify-between border-t px-3 py-2">
                <div className="flex items-center gap-1">
                  <Button size="sm" type="button" variant="ghost" className="h-8 w-8 p-0">
                    <PaperclipIcon className="size-4" />
                  </Button>
                  <Button size="sm" type="button" variant="ghost" className="h-8 w-8 p-0">
                    <SmileIcon className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={handleEnhanceResponse}
                    disabled={
                      conversation?.status === "resolved" ||
                      isEnhancing ||
                      !form.formState.isValid
                    }
                    className="h-8 gap-1.5 px-2"
                  >
                    <Wand2Icon className="size-3.5" />
                    <span className="text-xs">{isEnhancing ? "Enhancing..." : "Enhance"}</span>
                  </Button>
                </div>
                <Button
                  size="sm"
                  type="submit"
                  disabled={
                    conversation?.status === "resolved" ||
                    !form.formState.isValid ||
                    form.formState.isSubmitting ||
                    isEnhancing
                  }
                  className="h-8 w-8 p-0"
                >
                  <SendIcon className="size-4" />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export const ConversationIdViewLoading = () => {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header Skeleton */}
      <header className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </header>

      {/* Mensagens Skeleton */}
      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        {Array.from({ length: 6 }, (_, index) => {
          const isUser = index % 2 === 0;
          const widths = ["w-48", "w-60", "w-72"];
          const width = widths[index % widths.length];

          return (
            <div
              className={cn(
                "flex items-end gap-2",
                !isUser && "flex-row-reverse"
              )}
              key={index}
            >
              {isUser && <Skeleton className="size-8 shrink-0 rounded-full" />}
              <Skeleton className={cn("h-12 rounded-2xl", width)} />
            </div>
          );
        })}
      </div>

      {/* Input Skeleton */}
      <div className="shrink-0 border-t bg-background p-4">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
};
