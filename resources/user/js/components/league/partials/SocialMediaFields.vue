<script setup lang="ts">
import { ref, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

interface Props {
  discordUrl: string;
  websiteUrl: string;
  twitterHandle: string;
  instagramHandle: string;
  youtubeUrl: string;
  twitchUrl: string;
  errors?: {
    discord_url?: string;
    website_url?: string;
    twitter_handle?: string;
    instagram_handle?: string;
    youtube_url?: string;
    twitch_url?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
});

const emit = defineEmits([
  'update:discordUrl',
  'update:websiteUrl',
  'update:twitterHandle',
  'update:instagramHandle',
  'update:youtubeUrl',
  'update:twitchUrl',
]);

const expanded = ref(false);

const allFieldsEmpty = computed(() => {
  return (
    !props.discordUrl &&
    !props.websiteUrl &&
    !props.twitterHandle &&
    !props.instagramHandle &&
    !props.youtubeUrl &&
    !props.twitchUrl
  );
});

function toggleExpand(): void {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Social Media Links</h3>
      <Button
        v-if="!expanded"
        :label="allFieldsEmpty ? 'Add Social Links' : 'Show More'"
        icon="pi pi-angle-down"
        text
        @click="toggleExpand"
      />
      <Button v-else label="Show Less" icon="pi pi-angle-up" text @click="toggleExpand" />
    </div>

    <p class="text-sm text-gray-600">Optional: Add links to your league's social media presence</p>

    <!-- Primary fields (always visible) -->
    <div class="space-y-4">
      <!-- Discord -->
      <div class="space-y-2">
        <label for="discord-url" class="block font-medium">Discord Server</label>
        <InputText
          id="discord-url"
          :model-value="discordUrl"
          placeholder="https://discord.gg/your-server"
          :class="{ 'p-invalid': !!errors?.discord_url }"
          class="w-full"
          @update:model-value="emit('update:discordUrl', $event)"
        />
        <small v-if="errors?.discord_url" class="text-red-500">
          {{ errors.discord_url }}
        </small>
      </div>

      <!-- Website -->
      <div class="space-y-2">
        <label for="website-url" class="block font-medium">Website</label>
        <InputText
          id="website-url"
          :model-value="websiteUrl"
          placeholder="https://your-league-website.com"
          :class="{ 'p-invalid': !!errors?.website_url }"
          class="w-full"
          @update:model-value="emit('update:websiteUrl', $event)"
        />
        <small v-if="errors?.website_url" class="text-red-500">
          {{ errors.website_url }}
        </small>
      </div>
    </div>

    <!-- Expanded fields (show when expanded) -->
    <div v-if="expanded" class="space-y-4 pt-4 border-t">
      <!-- Twitter -->
      <div class="space-y-2">
        <label for="twitter-handle" class="block font-medium">Twitter/X Handle</label>
        <div class="flex items-center gap-2">
          <span class="text-gray-600">@</span>
          <InputText
            id="twitter-handle"
            :model-value="twitterHandle"
            placeholder="yourleague"
            :class="{ 'p-invalid': !!errors?.twitter_handle }"
            class="flex-1"
            @update:model-value="emit('update:twitterHandle', $event)"
          />
        </div>
        <small v-if="errors?.twitter_handle" class="text-red-500">
          {{ errors.twitter_handle }}
        </small>
      </div>

      <!-- Instagram -->
      <div class="space-y-2">
        <label for="instagram-handle" class="block font-medium">Instagram Handle</label>
        <div class="flex items-center gap-2">
          <span class="text-gray-600">@</span>
          <InputText
            id="instagram-handle"
            :model-value="instagramHandle"
            placeholder="yourleague"
            :class="{ 'p-invalid': !!errors?.instagram_handle }"
            class="flex-1"
            @update:model-value="emit('update:instagramHandle', $event)"
          />
        </div>
        <small v-if="errors?.instagram_handle" class="text-red-500">
          {{ errors.instagram_handle }}
        </small>
      </div>

      <!-- YouTube -->
      <div class="space-y-2">
        <label for="youtube-url" class="block font-medium">YouTube Channel</label>
        <InputText
          id="youtube-url"
          :model-value="youtubeUrl"
          placeholder="https://youtube.com/@yourchannel"
          :class="{ 'p-invalid': !!errors?.youtube_url }"
          class="w-full"
          @update:model-value="emit('update:youtubeUrl', $event)"
        />
        <small v-if="errors?.youtube_url" class="text-red-500">
          {{ errors.youtube_url }}
        </small>
      </div>

      <!-- Twitch -->
      <div class="space-y-2">
        <label for="twitch-url" class="block font-medium">Twitch Channel</label>
        <InputText
          id="twitch-url"
          :model-value="twitchUrl"
          placeholder="https://twitch.tv/yourchannel"
          :class="{ 'p-invalid': !!errors?.twitch_url }"
          class="w-full"
          @update:model-value="emit('update:twitchUrl', $event)"
        />
        <small v-if="errors?.twitch_url" class="text-red-500">
          {{ errors.twitch_url }}
        </small>
      </div>
    </div>
  </div>
</template>
