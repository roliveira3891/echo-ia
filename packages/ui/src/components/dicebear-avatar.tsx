"use client";

import { useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";

interface DicebearAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  badgeClassName?: string;
  imageUrl?: string;
  badgeImageUrl?: string;
  name?: string;
};

export const DicebearAvatar = ({
  seed,
  size = 32,
  className,
  imageUrl,
  badgeClassName,
  badgeImageUrl,
  name,
}: DicebearAvatarProps) => {
  // Gera as iniciais a partir do nome (máximo 2 letras)
  const initials = useMemo(() => {
    if (!name) return "?";

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      // Se for uma palavra só, pega as 2 primeiras letras
      return words[0].substring(0, 2).toUpperCase();
    }
    // Se for mais de uma palavra, pega a primeira letra de cada uma (máximo 2)
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }, [name]);

  const badgeSize = Math.round(size * 0.5);

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <Avatar
        className={cn("border", className)}
        style={{ width: size, height: size }}
      >
        {imageUrl && <AvatarImage alt="Avatar" src={imageUrl} />}
        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {badgeImageUrl && (
        <div
          className={cn(
            "absolute right-0 bottom-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background",
            badgeClassName
          )}
          style={{
            width: badgeSize,
            height: badgeSize,
            transform: "translate(15%, 15%)",
          }}
        >
          <img
            alt="Badge"
            className="h-full w-full object-cover"
            height={badgeSize}
            src={badgeImageUrl}
            width={badgeSize}
          />
        </div>
      )}
    </div>
  );
};
