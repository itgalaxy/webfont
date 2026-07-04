<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import HeroDemo from "./HeroDemo.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <HeroDemo />
    </template>
  </Layout>
</template>
