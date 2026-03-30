import type { TabMeta, Settings } from "./types";
import { STORAGE_KEY_SETTINGS, STORAGE_KEY_TAB_META } from "./constants";
import { getDefaultSettings } from "./shameEngine";

async function ensureTabMetaIsNamespaced(): Promise<Record<string, TabMeta>> {
  // Tab metadata storage format (namespaced):
  // local: { tabMeta: { [tabId]: { openedAt } } }
  //
  // Legacy format:
  // local: { [tabId]: { openedAt } }
  // We migrate on first access so storage writes don't accidentally discard legacy entries.
  const result = await chrome.storage.local.get(STORAGE_KEY_TAB_META);
  const namespaced = result[STORAGE_KEY_TAB_META] as
    | Record<string, TabMeta>
    | undefined;

  if (namespaced && typeof namespaced === "object") {
    return namespaced;
  }

  const legacyResult = await chrome.storage.local.get(null);
  const migrated: Record<string, TabMeta> = {};
  for (const [key, value] of Object.entries(legacyResult)) {
    if (!/^\d+$/.test(key)) continue; // only migrate probable tab-id keys
    if (typeof value === "object" && value !== null && "openedAt" in value) {
      migrated[key] = value as TabMeta;
    }
  }

  if (Object.keys(migrated).length === 0) return {};

  await chrome.storage.local.set({ [STORAGE_KEY_TAB_META]: migrated });
  // Best-effort cleanup; ignore errors to avoid breaking extension startup.
  try {
    await chrome.storage.local.remove(Object.keys(migrated));
  } catch {
    // no-op
  }

  return migrated;
}

export async function getTabMeta(tabId: number): Promise<TabMeta | null> {
  const all = await ensureTabMetaIsNamespaced();
  return all[tabId.toString()] ?? null;
}

export async function setTabMeta(tabId: number, meta: TabMeta): Promise<void> {
  const all = await ensureTabMetaIsNamespaced();
  all[tabId.toString()] = meta;
  await chrome.storage.local.set({ [STORAGE_KEY_TAB_META]: all });
}

export async function removeTabMeta(tabId: number): Promise<void> {
  const all = await ensureTabMetaIsNamespaced();
  delete all[tabId.toString()];
  if (Object.keys(all).length === 0) {
    await chrome.storage.local.remove(STORAGE_KEY_TAB_META);
    return;
  }

  await chrome.storage.local.set({ [STORAGE_KEY_TAB_META]: all });
}

export async function getAllTabMeta(): Promise<Record<string, TabMeta>> {
  // Note: we always return a namespaced object, and lazily migrate legacy keys on first access.
  return ensureTabMetaIsNamespaced();
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY_SETTINGS);
  return result[STORAGE_KEY_SETTINGS] || getDefaultSettings();
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY_SETTINGS]: settings });
}

