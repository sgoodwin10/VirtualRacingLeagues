<script setup lang="ts">
import SocialMediaFields from '@app/components/league/partials/SocialMediaFields.vue';
import type { CreateLeagueForm, FormErrors } from '@app/types/league';

interface Props {
  form: CreateLeagueForm;
  errors: FormErrors;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:discordUrl': [value: string];
  'update:websiteUrl': [value: string];
  'update:twitterHandle': [value: string];
  'update:instagramHandle': [value: string];
  'update:facebookHandle': [value: string];
  'update:youtubeUrl': [value: string];
  'update:twitchUrl': [value: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Social Links</h3>
      <p class="text-[var(--text-secondary)] m-0">Connect your community channels</p>
    </div>

    <SocialMediaFields
      :discord-url="form.discord_url"
      :website-url="form.website_url"
      :twitter-handle="form.twitter_handle"
      :instagram-handle="form.instagram_handle"
      :facebook-handle="form.facebook_handle"
      :youtube-url="form.youtube_url"
      :twitch-url="form.twitch_url"
      :errors="{
        discord_url: errors.discord_url,
        website_url: errors.website_url,
        twitter_handle: errors.twitter_handle,
        instagram_handle: errors.instagram_handle,
        facebook_handle: errors.facebook_handle,
        youtube_url: errors.youtube_url,
        twitch_url: errors.twitch_url,
      }"
      @update:discord-url="emit('update:discordUrl', $event)"
      @update:website-url="emit('update:websiteUrl', $event)"
      @update:twitter-handle="emit('update:twitterHandle', $event)"
      @update:instagram-handle="emit('update:instagramHandle', $event)"
      @update:facebook-handle="emit('update:facebookHandle', $event)"
      @update:youtube-url="emit('update:youtubeUrl', $event)"
      @update:twitch-url="emit('update:twitchUrl', $event)"
    />
  </div>
</template>
