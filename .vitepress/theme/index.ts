import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

// Extend the default theme and render the live font demo in the hero's image
// slot (right side on large screens, stacked below the text on small ones).
export default {
  extends: DefaultTheme,
  Layout,
};
