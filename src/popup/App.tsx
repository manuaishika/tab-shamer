import { useEffect, useState } from "react";
import { getSettings } from "~/shared/storage";
import { getShameMessage, getTabAgeDays, getDefaultSettings } from "~/shared/shameEngine";
import type { Settings, AncientTab } from "~/shared/types";
import { getAllTabMeta } from "~/shared/storage";

export default function App() {
  const [tabCount, setTabCount] = useState(0);
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [ancientTabs, setAncientTabs] = useState<AncientTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tabs, currentSettings, allMeta] = await Promise.all([
        chrome.tabs.query({}),
        getSettings(),
        getAllTabMeta(),
      ]);

      setTabCount(tabs.length);
      setSettings(currentSettings);

      // Find ancient tabs
      const ancient: AncientTab[] = [];
      for (const tab of tabs) {
        if (!tab.id || !tab.url || !tab.title) continue;

        const meta = allMeta[tab.id.toString()];
        if (!meta) continue;

        const ageDays = getTabAgeDays(meta.openedAt);
        if (ageDays >= currentSettings.ageLimitDays) {
          ancient.push({
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            ageDays,
          });
        }
      }

      setAncientTabs(ancient);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const shameMessage = getShameMessage(tabCount, settings);
  const oldestDays = ancientTabs.length > 0 
    ? Math.max(...ancientTabs.map((t) => t.ageDays))
    : 0;

  return (
    <div className="p-6 min-w-[320px] max-w-md">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Tab Shamer</h1>
        
        <div className="space-y-2">
          <p className="text-lg">
            You have <span className="font-mono font-bold text-xl">{tabCount}</span> tab{tabCount !== 1 ? "s" : ""} open.
          </p>
          <p className="italic text-gray-700">{shameMessage}</p>
        </div>

        {ancientTabs.length > 0 && settings.shameAncientTabs && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-yellow-800">
              ⚠️ You have {ancientTabs.length} ancient tab{ancientTabs.length > 1 ? "s" : ""} ({settings.ageLimitDays}+ days old)
            </p>
            {oldestDays > 0 && (
              <p className="text-sm text-yellow-700">
                Oldest tab: {oldestDays} day{oldestDays !== 1 ? "s" : ""}
              </p>
            )}
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
            >
              Review Tabs
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Settings
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Tab Shamer will never close a tab without asking.
        </p>
      </div>
    </div>
  );
}

