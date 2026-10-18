import type { SocialPlatform } from "@shared/types";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "x",
  "tiktok",
  "linkedin",
  "reddit",
  "other",
];

export function platformLabel(platform: SocialPlatform): string {
  if (platform === "x") {
    return "X (Twitter)";
  }

  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

export function accountSecurityLabel(
  hasEmailAndLogin: boolean,
  passwordStored: boolean,
): string {
  if (hasEmailAndLogin) {
    return "";
  }

  return passwordStored ? "Password stored securely" : "No password stored";
}
