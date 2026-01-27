<template>
  <SeasonDetailWhiteLabelView v-if="isWhiteLabel" />
  <SeasonDetailView v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SeasonDetailView from './SeasonDetailView.vue';
import SeasonDetailWhiteLabelView from './SeasonDetailWhiteLabelView.vue';

const route = useRoute();
const isWhiteLabel = computed(() => route.query.whitelabel === 'true');
</script>
