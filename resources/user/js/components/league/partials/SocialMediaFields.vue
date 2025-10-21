<script setup lang="ts">
import InputText from 'primevue/inputtext';
import FormLabel from '@user/components/common/forms/FormLabel.vue';
import FormError from '@user/components/common/forms/FormError.vue';
import {
  PhDiscordLogo,
  PhGlobe,
  PhTwitterLogo,
  PhInstagramLogo,
  PhYoutubeLogo,
  PhTwitchLogo,
} from '@phosphor-icons/vue';
import FormInputGroup from '@user/components/common/forms/FormInputGroup.vue';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

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

withDefaults(defineProps<Props>(), {
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
</script>

<template>
  <div class="space-y-4">
    <!-- Primary fields (always visible) -->
    <div class="space-y-2 grid grid-cols-2 md:grid-cols-3 gap-4">
      <!-- Discord -->
      <FormInputGroup>
        <FormLabel for="discord-url" text="Discord" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhDiscordLogo size="20" class="text-[#5865F2]/70"
          /></InputGroupAddon>
          <InputText
            id="discord-url"
            :model-value="discordUrl"
            placeholder="https://discord.gg/your-server"
            :class="{ 'p-invalid': !!errors?.discord_url }"
            class="w-full"
            size="small"
            @update:model-value="emit('update:discordUrl', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.discord_url" />
      </FormInputGroup>

      <!-- Website -->
      <FormInputGroup>
        <FormLabel for="website-url" text="Website" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhGlobe size="20" class="text-blue-600/70"
          /></InputGroupAddon>
          <InputText
            id="website-url"
            :model-value="websiteUrl"
            placeholder="https://your-league-website.com"
            :class="{ 'p-invalid': !!errors?.website_url }"
            class="w-full"
            size="small"
            @update:model-value="emit('update:websiteUrl', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.website_url" />
      </FormInputGroup>
      <!-- Twitter -->
      <FormInputGroup>
        <FormLabel for="twitter-handle" text="Twitter/X" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhTwitterLogo size="20" class="text-[#1DA1F2]/70"
          /></InputGroupAddon>
          <InputText
            id="twitter-handle"
            :model-value="twitterHandle"
            placeholder="yourleague"
            size="small"
            :class="{ 'p-invalid': !!errors?.twitter_handle }"
            class="w-full"
            @update:model-value="emit('update:twitterHandle', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.twitter_handle" />
      </FormInputGroup>

      <!-- Instagram -->
      <FormInputGroup>
        <FormLabel for="instagram-handle" text="Instagram" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhInstagramLogo size="20" class="text-[#E4405F]/70"
          /></InputGroupAddon>
          <InputText
            id="instagram-handle"
            :model-value="instagramHandle"
            placeholder="yourleague"
            size="small"
            :class="{ 'p-invalid': !!errors?.instagram_handle }"
            class="w-full"
            @update:model-value="emit('update:instagramHandle', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.instagram_handle" />
      </FormInputGroup>

      <!-- YouTube -->
      <FormInputGroup>
        <FormLabel for="youtube-url" text="YouTube" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhYoutubeLogo size="20" class="text-red-600/70"
          /></InputGroupAddon>
          <InputText
            id="youtube-url"
            :model-value="youtubeUrl"
            placeholder="https://youtube.com/@yourchannel"
            size="small"
            :class="{ 'p-invalid': !!errors?.youtube_url }"
            class="w-full"
            @update:model-value="emit('update:youtubeUrl', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.youtube_url" />
      </FormInputGroup>

      <!-- Twitch -->
      <FormInputGroup>
        <FormLabel for="twitch-url" text="Twitch" />
        <InputGroup>
          <InputGroupAddon class="p-0"
            ><PhTwitchLogo size="20" class="text-[#9146FF]/70"
          /></InputGroupAddon>
          <InputText
            id="twitch-url"
            :model-value="twitchUrl"
            placeholder="https://twitch.tv/yourchannel"
            size="small"
            :class="{ 'p-invalid': !!errors?.twitch_url }"
            class="w-full"
            @update:model-value="emit('update:twitchUrl', $event)"
          />
        </InputGroup>
        <FormError :error="errors?.twitch_url" />
      </FormInputGroup>
    </div>
  </div>
</template>
