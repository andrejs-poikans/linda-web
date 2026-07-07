// @ts-check
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  // adapter: netlify(),
  adapter: netlify({
    imageCDN: false, // disables routing through /.netlify/images
  }),
  integrations: [preact()],
});
