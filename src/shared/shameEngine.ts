import type { Settings } from "./types";
import { DEFAULT_TAB_LIMIT, DEFAULT_AGE_LIMIT_DAYS } from "./constants";

export function getShameMessage(count: number, settings: Settings): string {
  const { shameLevel, tabLimit } = settings;

  if (shameLevel === "nice") {
    if (count >= tabLimit * 2) return "😊 You have quite a few tabs open. Consider closing some?";
    if (count >= tabLimit) return "🙂 You've reached your tab limit. Maybe time for a cleanup?";
    return "✨ You're doing great with your tabs!";
  }

  if (shameLevel === "firm") {
    if (count >= tabLimit * 2.5) return "😒 This is getting out of hand. You don't need all of these.";
    if (count >= tabLimit * 1.5) return "😬 You've lost control of the situation.";
    if (count >= tabLimit) return "😒 Be honest. You won't read all of these.";
    return "🙂 You are still a good person.";
  }

  // unhinged
  if (count >= tabLimit * 2.5) return "🚨 This is not multitasking. This is avoidance.";
  if (count >= tabLimit * 1.5) return "🚨 This is a cry for help.";
  if (count >= tabLimit) return "😒 You have too many tabs. This is chaos.";
  return "🙂 You are still redeemable.";
}

export function getAncientTabMessage(
  count: number,
  oldestDays: number,
  settings: Settings
): string {
  const { shameLevel } = settings;

  if (shameLevel === "nice") {
    return `You have ${count} tab${count > 1 ? "s" : ""} older than ${settings.ageLimitDays} days. Consider reviewing them?`;
  }

  if (shameLevel === "firm") {
    if (oldestDays > 14) return `Some of your tabs are old enough to vote. You have ${count} tabs older than ${settings.ageLimitDays} days.`;
    return `You have ${count} tab${count > 1 ? "s" : ""} older than ${settings.ageLimitDays} days. They are probably not coming back.`;
  }

  // unhinged
  if (oldestDays > 21) return `🚨 You have a tab that's been open for ${oldestDays} days. This is not a bookmark, it's a cry for help.`;
  if (oldestDays > 14) return `🚨 Some of your tabs are old enough to drive. You have ${count} ancient tabs.`;
  return `😬 You have ${count} tab${count > 1 ? "s" : ""} older than ${settings.ageLimitDays} days. Let them go.`;
}

export function getTabAgeDays(openedAt: number): number {
  const ms = Date.now() - openedAt;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getDefaultSettings(): Settings {
  return {
    tabLimit: DEFAULT_TAB_LIMIT,
    ageLimitDays: DEFAULT_AGE_LIMIT_DAYS,
    shameLevel: "firm",
    soundEnabled: false,
    shameAncientTabs: true,
    alwaysAskBeforeClosing: true,
  };
}

