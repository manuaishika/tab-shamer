import type { Manifest } from "vite-plugin-web-extension";

const manifest: Manifest = {
  manifest_version: 3,
  name: "Tab Shamer",
  version: "1.0.0",
  description: "Judges you for having too many tabs.",
  permissions: ["tabs", "notifications", "storage", "alarms"],
  background: {
    service_worker: "background/index.js",
  },
  action: {
    default_popup: "popup/index.html",
    default_icon: {
      16: "icon.png",
      48: "icon.png",
      128: "icon.png",
    },
  },
  icons: {
    16: "icon.png",
    48: "icon.png",
    128: "icon.png",
  },
  options_page: "options/index.html",
};

export default manifest;

