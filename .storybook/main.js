/** Storybook config. Run locally with: bun run storybook */
const config = {
  stories: ["../src/**/*.stories.@(js|jsx)"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: {
    // Use a minimal Vite config — the app's config includes the TanStack Start
    // server plugin, which Storybook doesn't need.
    builder: { name: "@storybook/builder-vite", options: { viteConfigPath: ".storybook/vite.config.js" } },
  },
};
export default config;
