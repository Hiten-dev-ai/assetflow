import type { Plugin } from "vite";

/**
 * Local fallback for the generated Sites plugin. The repository can run as a
 * normal Vinext app when the Sites build artifact is not present.
 */
export function sites(): Plugin {
  return {
    name: "assetflow-sites-fallback",
  };
}
