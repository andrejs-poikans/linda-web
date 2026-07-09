// @ts-check
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  site: "https://lindamence.com",
  adapter: netlify(),
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !page.includes("/admin"),
    }),
  ],
});
