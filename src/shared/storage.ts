import type { TabMeta, Settings } from "./types";
import { STORAGE_KEY_TAB_META, STORAGE_KEY_SETTINGS } from "./constants";
import { getDefaultSettings } from "./shameEngine";

export async function getTabMeta(tabId: number): Promise<TabMeta | null> {
  const result = await chrome.storage.local.get(tabId.toString());
  return result[tabId.toString()] || null;
}

export async function setTabMeta(tabId: number, meta: TabMeta): Promise<void> {
  await chrome.storage.local.set({ [tabId.toString()]: meta });
}

export async function removeTabMeta(tabId: number): Promise<void> {
  await chrome.storage.local.remove(tabId.toString());
}

export async function getAllTabMeta(): Promise<Record<string, TabMeta>> {
  const result = await chrome.storage.local.get(null);
  const meta: Record<string, TabMeta> = {};
  
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "object" && value !== null && "openedAt" in value) {
      meta[key] = value as TabMeta;
    }
  }
  
  return meta;
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY_SETTINGS);
  return result[STORAGE_KEY_SETTINGS] || getDefaultSettings();
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: settings });
}

