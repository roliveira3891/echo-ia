/**
 * Get channel icon path
 * @param channel - Channel name (widget, whatsapp, instagram, telegram, facebook, tiktok, linkedin, evolution)
 * @returns Path to the channel icon or undefined if channel is not recognized
 */
export function getChannelIcon(channel?: string): string | undefined {
  // Se não tem canal definido, assume que é do widget (sessões antigas)
  const channelName = channel || "widget";

  const channelMap: Record<string, string> = {
    widget: "/channels/widget.svg",
    whatsapp: "/channels/whatsapp.svg",
    instagram: "/channels/instagram.svg",
    telegram: "/channels/telegram.svg",
    facebook: "/channels/facebook-messenger.svg",
    tiktok: "/channels/tiktok.svg",
    linkedin: "/channels/linkedin.svg",
    evolution: "/channels/evolution.svg",
  };

  return channelMap[channelName.toLowerCase()];
}

/**
 * Get channel display name
 * @param channel - Channel name
 * @returns Human-readable channel name
 */
export function getChannelName(channel?: string): string {
  if (!channel) {
    return "Unknown";
  }

  const nameMap: Record<string, string> = {
    widget: "Web Widget",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    telegram: "Telegram",
    facebook: "Facebook Messenger",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    evolution: "Evolution API",
  };

  return nameMap[channel.toLowerCase()] || channel;
}

