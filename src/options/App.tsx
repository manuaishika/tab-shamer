import { useEffect, useState } from "react";
import { getSettings, setSettings, getAllTabMeta } from "~/shared/storage";
import { getTabAgeDays, getDefaultSettings } from "~/shared/shameEngine";
import type { Settings, AncientTab } from "~/shared/types";
import { MIN_AGE_LIMIT_DAYS, MAX_AGE_LIMIT_DAYS } from "~/shared/constants";

export default function App() {
  const [settings, setSettingsState] = useState<Settings>(getDefaultSettings());
  const [ancientTabs, setAncientTabs] = useState<AncientTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

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

      setSettingsState(currentSettings);

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

      // Sort by age (oldest first)
      ancient.sort((a, b) => b.ageDays - a.ageDays);
      setAncientTabs(ancient);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSettingsChange(updates: Partial<Settings>) {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);
    await setSettings(newSettings);
    await loadData(); // Reload to reflect new age limit
  }

  function handleTabSelect(tabId: number) {
    const newSelected = new Set(selectedTabs);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabs(newSelected);
  }

  function handleSelectAll() {
    if (selectedTabs.size === ancientTabs.length) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(ancientTabs.map((t) => t.tabId)));
    }
  }

  async function handleCloseTabs() {
    if (selectedTabs.size === 0) return;
    setShowCloseConfirm(true);
  }

  async function confirmCloseTabs() {
    const tabIds = Array.from(selectedTabs);
    await chrome.tabs.remove(tabIds);
    setSelectedTabs(new Set());
    setShowCloseConfirm(false);
    await loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-rose-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-violet-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-rose-100 p-6">
          <h1 className="text-3xl font-extrabold text-rose-500 mb-6">Tab Shamer Settings</h1>

          <div className="space-y-6">
            {/* Tab Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tab Limit: {settings.tabLimit}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={settings.tabLimit}
                aria-label="Tab limit"
                onChange={(e) =>
                  handleSettingsChange({ tabLimit: parseInt(e.target.value) })
                }
                className="w-full accent-rose-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shame triggers when you exceed this many tabs
              </p>
            </div>

            {/* Age Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ancient Tab Age (days): {settings.ageLimitDays}
              </label>
              <input
                type="range"
                min={MIN_AGE_LIMIT_DAYS}
                max={MAX_AGE_LIMIT_DAYS}
                value={settings.ageLimitDays}
                aria-label="Ancient tab age in days"
                onChange={(e) =>
                  handleSettingsChange({ ageLimitDays: parseInt(e.target.value) })
                }
                className="w-full accent-rose-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tabs older than this are considered "ancient"
              </p>
            </div>

            {/* Shame Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shame Level
              </label>
              <select
                value={settings.shameLevel}
                aria-label="Shame level"
                onChange={(e) =>
                  handleSettingsChange({
                    shameLevel: e.target.value as Settings["shameLevel"],
                  })
                }
                className="w-full px-3 py-2 border border-rose-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="nice">Nice 🙂</option>
                <option value="firm">Firm 😒</option>
                <option value="unhinged">Unhinged 🚨</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.shameAncientTabs}
                  onChange={(e) =>
                    handleSettingsChange({ shameAncientTabs: e.target.checked })
                  }
                  className="rounded-full border-rose-300 text-rose-500 focus:ring-rose-300"
                />
                <span className="text-sm text-gray-700">
                  Shame me about ancient tabs
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    handleSettingsChange({ soundEnabled: e.target.checked })
                  }
                  className="rounded-full border-rose-300 text-rose-500 focus:ring-rose-300"
                  disabled
                />
                <span className="text-sm text-gray-700">
                  Sound effects (not implemented yet)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Ancient Tabs Review */}
        {ancientTabs.length > 0 && settings.shameAncientTabs && (
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-rose-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Ancient Tabs ({ancientTabs.length})
              </h2>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-full transition-colors"
                >
                  {selectedTabs.size === ancientTabs.length ? "Deselect All" : "Select All"}
                </button>
                {selectedTabs.size > 0 && (
                  <button
                    onClick={handleCloseTabs}
                    className="px-3 py-1 text-sm bg-rose-500 text-white hover:bg-rose-600 rounded-full transition-colors"
                  >
                    Close Selected ({selectedTabs.size})
                  </button>
                )}
              </div>
            </div>

            {showCloseConfirm && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <p className="font-semibold text-rose-800 mb-2">
                  Are you sure you want to close {selectedTabs.size} tab{selectedTabs.size > 1 ? "s" : ""}?
                </p>
                <div className="text-sm text-rose-700 mb-3 space-y-1">
                  {ancientTabs
                    .filter((t) => selectedTabs.has(t.tabId))
                    .slice(0, 5)
                    .map((tab) => (
                      <div key={tab.tabId} className="flex items-center space-x-2">
                        <span>•</span>
                        <span className="truncate">{tab.title || tab.url}</span>
                        <span className="text-rose-600">({tab.ageDays} days)</span>
                      </div>
                    ))}
                  {selectedTabs.size > 5 && (
                    <p className="text-xs">...and {selectedTabs.size - 5} more</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={confirmCloseTabs}
                    className="px-4 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    Yes, close selected tabs
                  </button>
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="px-4 py-2 bg-rose-100 text-rose-800 rounded-full hover:bg-rose-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ancientTabs.map((tab) => (
                <label
                  key={tab.tabId}
                  className="flex items-start space-x-3 p-3 hover:bg-rose-50 rounded-2xl border border-rose-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTabs.has(tab.tabId)}
                    onChange={() => handleTabSelect(tab.tabId)}
                    className="mt-1 rounded-full border-rose-300 text-rose-500 focus:ring-rose-300"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-rose-900 truncate">
                        {tab.title || "Untitled"}
                      </p>
                      <span className="ml-2 text-xs text-rose-600 font-semibold whitespace-nowrap">
                        {tab.ageDays} day{tab.ageDays !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-rose-500 truncate">{tab.url}</p>
                  </div>
                </label>
              ))}
            </div>

            {ancientTabs.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No ancient tabs found. You're doing great! 🎉
              </p>
            )}
          </div>
        )}

        {ancientTabs.length === 0 && (
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-rose-100 p-6 text-center">
            <p className="text-rose-500">No ancient tabs to review. Keep it up! ✨</p>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-sm border border-rose-100 p-6">
          <p className="text-xs text-rose-500 text-center">
            Tab Shamer will never close a tab without your explicit confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}

