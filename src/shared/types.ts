export type TabMeta = {
  openedAt: number; // Date.now() timestamp
};

export type Settings = {
  tabLimit: number;
  ageLimitDays: number;
  shameLevel: "nice" | "firm" | "unhinged";
  soundEnabled: boolean;
  shameAncientTabs: boolean;
  alwaysAskBeforeClosing: boolean; // Always true, but stored for clarity
};

export type AncientTab = {
  tabId: number;
  url: string;
  title: string;
  ageDays: number;
};

