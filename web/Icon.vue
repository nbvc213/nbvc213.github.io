<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
</script>
<template><svg :width="size || 20" :height="size || 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use :href="'/media/icons.svg#' + name"/></svg></template>
