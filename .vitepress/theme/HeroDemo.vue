<script setup lang="ts">
// Glyphs from the demo font generated at build time (public/font-demo).
// Codepoints match the CLI html template output (\ea01, \ea02, \ea03).
const glyphs = [
  { label: "avatar", code: 0xea01 },
  { label: "envelope", code: 0xea02 },
  { label: "phone-call", code: 0xea03 },
].map((glyph) => ({ ...glyph, char: String.fromCodePoint(glyph.code) }));
</script>

<template>
  <div class="hero-demo">
    <div class="hero-demo__grid">
      <figure v-for="glyph in glyphs" :key="glyph.label" class="hero-demo__cell">
        <span class="hero-demo__glyph">{{ glyph.char }}</span>
        <figcaption class="hero-demo__label">.webfont-{{ glyph.label }}</figcaption>
      </figure>
    </div>
    <p class="hero-demo__caption">A live font, built from 3 SVG icons</p>
  </div>
</template>

<style>
@font-face {
  font-family: "webfont-demo";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src:
    url("/font-demo/webfont.woff2") format("woff2"),
    url("/font-demo/webfont.woff") format("woff");
}
</style>

<style scoped>
.hero-demo {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-2);
}

.hero-demo__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.hero-demo__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 16px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  transition: color 0.25s, border-color 0.25s, transform 0.25s;
}

.hero-demo__cell:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.hero-demo__glyph {
  font-family: "webfont-demo", sans-serif;
  font-size: 44px;
  line-height: 1;
  color: var(--vp-c-brand-1);
}

.hero-demo__label {
  max-width: 100%;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-3);
  text-align: center;
  overflow-wrap: anywhere;
}

.hero-demo__caption {
  margin: 20px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .hero-demo {
    max-width: 340px;
    padding: 20px;
  }

  .hero-demo__glyph {
    font-size: 36px;
  }
}
</style>
