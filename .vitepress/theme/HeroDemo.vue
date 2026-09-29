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
  <div class="hero-demo" aria-label="Live icon font preview">
    <div class="hero-demo__plane" aria-hidden="true" />
    <div class="hero-demo__glyphs">
      <span
        v-for="(glyph, index) in glyphs"
        :key="glyph.label"
        class="hero-demo__glyph"
        :style="{ '--i': String(index) }"
        :title="glyph.label"
      >
        {{ glyph.char }}
      </span>
    </div>
    <p class="hero-demo__caption">
      Live font from SVG fixtures:<br />
      one font, many glyphs
    </p>
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
  position: relative;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 36px 20px 28px;
  isolation: isolate;
}

.hero-demo__plane {
  position: absolute;
  inset: 8% 4% 18%;
  z-index: -1;
  border-radius: 40% 60% 55% 45% / 45% 40% 60% 55%;
  background:
    radial-gradient(ellipse 80% 70% at 30% 20%, color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent), transparent 70%),
    radial-gradient(ellipse 70% 80% at 80% 70%, color-mix(in srgb, var(--vp-c-brand-2, var(--vp-c-brand-1)) 14%, transparent), transparent 65%),
    linear-gradient(160deg, color-mix(in srgb, var(--vp-c-bg-soft) 80%, transparent), transparent);
  filter: blur(0.5px);
  animation: hero-demo-drift 14s ease-in-out infinite alternate;
}

.hero-demo__glyphs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(20px, 5vw, 40px);
  min-height: 120px;
}

.hero-demo__glyph {
  font-family: "webfont-demo", sans-serif;
  font-size: clamp(40px, 8vw, 56px);
  line-height: 1;
  color: var(--vp-c-brand-1);
  transform: translateY(0);
  animation: hero-demo-rise 2.4s ease-out both;
  animation-delay: calc(var(--i) * 0.12s);
  transition: color 0.3s ease, transform 0.35s ease;
}

.hero-demo__glyph:hover {
  color: var(--vp-c-brand-2, var(--vp-c-brand-1));
  transform: translateY(-6px);
}

.hero-demo__caption {
  margin: 28px 0 0;
  text-align: center;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-2);
  animation: hero-demo-fade 1.2s ease 0.45s both;
}

@keyframes hero-demo-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-demo-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes hero-demo-drift {
  from {
    transform: translate(-2%, -1%) rotate(-1deg) scale(1);
  }
  to {
    transform: translate(2%, 2%) rotate(1.5deg) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-demo__plane,
  .hero-demo__glyph,
  .hero-demo__caption {
    animation: none;
  }

  .hero-demo__glyph:hover {
    transform: none;
  }
}

@media (max-width: 640px) {
  .hero-demo {
    padding: 24px 12px 16px;
  }

  .hero-demo__glyphs {
    min-height: 96px;
  }
}
</style>
