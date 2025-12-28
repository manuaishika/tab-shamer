import { getSettings, setTabMeta, removeTabMeta, getAllTabMeta } from "~/shared/storage";
import { getShameMessage, getAncientTabMessage, getTabAgeDays } from "~/shared/shameEngine";
import type { AncientTab, Settings } from "~/shared/types";

// Rate limiting: track last notification time to avoid spam
let lastTabCountNotification = 0;
let lastAncientTabNotification = 0;
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// Track tab creation time
chrome.tabs.onCreated.addListener(async (tab: chrome.tabs.Tab) => {
  if (!tab.id) return;
  
  await setTabMeta(tab.id, {
    openedAt: Date.now(),
  });
});

// Clean up when tabs are removed
chrome.tabs.onRemoved.addListener(async (tabId: number) => {
  await removeTabMeta(tabId);
});

// Track tabs when they're updated (for tabs that existed before extension install)
chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
  if (changeInfo.status === "complete" && changeInfo.url) {
    // Check if we have metadata for this tab, if not, create it
    // This handles tabs that existed before the extension was installed
    const meta = await chrome.storage.local.get(tabId.toString());
    if (!meta[tabId.toString()]) {
      await setTabMeta(tabId, {
        openedAt: Date.now(),
      });
    }
  }
});

async function checkTabs() {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});

  // Check tab count
  if (tabs.length >= settings.tabLimit) {
    await showTabCountNotification(tabs.length, settings);
  }

  // Check ancient tabs
  if (settings.shameAncientTabs) {
    await checkAncientTabs(tabs, settings);
  }
}

async function showTabCountNotification(count: number, settings: Settings) {
  const now = Date.now();
  if (now - lastTabCountNotification < NOTIFICATION_COOLDOWN_MS) {
    return; // Rate limit: don't spam notifications
  }
  
  const message = getShameMessage(count, settings);
  
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "Tab Shamer 😒",
      message,
    });
    lastTabCountNotification = now;
  } catch (error) {
    // Notification permission might not be granted
    console.error("Failed to show notification:", error);
  }
}

async function checkAncientTabs(tabs: chrome.tabs.Tab[], settings: Settings) {
  const allMeta = await getAllTabMeta();
  const ancientTabs: AncientTab[] = [];

  for (const tab of tabs) {
    if (!tab.id) continue;

    const meta = allMeta[tab.id.toString()];
    if (!meta) continue;

    const ageDays = getTabAgeDays(meta.openedAt);
    if (ageDays >= settings.ageLimitDays && tab.url && tab.title) {
      ancientTabs.push({
        tabId: tab.id,
        url: tab.url,
        title: tab.title,
        ageDays,
      });
    }
  }

  if (ancientTabs.length > 0) {
    const oldestDays = Math.max(...ancientTabs.map((t) => t.ageDays));
    await showAncientTabNotification(ancientTabs.length, oldestDays, settings);
  }
}

async function showAncientTabNotification(
  count: number,
  oldestDays: number,
  settings: Settings
) {
  const now = Date.now();
  if (now - lastAncientTabNotification < NOTIFICATION_COOLDOWN_MS) {
    return; // Rate limit: don't spam notifications
  }
  
  const message = getAncientTabMessage(count, oldestDays, settings);

  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "Ancient Tabs Detected 🏺",
      message,
    });
    lastAncientTabNotification = now;
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
}

// Periodic check (every 5 minutes)
chrome.alarms.create("checkTabs", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === "checkTabs") {
    checkTabs();
  }
});

// Initial check on startup
chrome.runtime.onStartup.addListener(() => {
  checkTabs();
});

chrome.runtime.onInstalled.addListener(() => {
  checkTabs();
});

