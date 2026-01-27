import { describe, it, expect } from 'vitest';
import { mountWithStubs } from '@app/__tests__/setup';
import SocialMediaFields from './partials/SocialMediaFields.vue';

describe('SocialMediaFields', () => {
  const defaultProps = {
    discordUrl: '',
    websiteUrl: '',
    twitterHandle: '',
    instagramHandle: '',
    youtubeUrl: '',
    twitchUrl: '',
  };

  it('renders all social media fields', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // All fields should be visible
    expect(wrapper.find('#discord-url').exists()).toBe(true);
    expect(wrapper.find('#website-url').exists()).toBe(true);
    expect(wrapper.find('#twitter-handle').exists()).toBe(true);
    expect(wrapper.find('#instagram-handle').exists()).toBe(true);
    expect(wrapper.find('#youtube-url').exists()).toBe(true);
    expect(wrapper.find('#twitch-url').exists()).toBe(true);
  });

  it('shows field labels', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Discord');
    expect(wrapper.text()).toContain('Website');
    expect(wrapper.text()).toContain('Twitter/X');
    expect(wrapper.text()).toContain('Instagram');
    expect(wrapper.text()).toContain('YouTube');
    expect(wrapper.text()).toContain('Twitch');
  });

  it('emits update:discordUrl when Discord input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const discordInput = wrapper.find('#discord-url');
    await discordInput.setValue('https://discord.gg/newlink');

    expect(wrapper.emitted('update:discordUrl')).toBeTruthy();
    expect(wrapper.emitted('update:discordUrl')?.[0]).toEqual(['https://discord.gg/newlink']);
  });

  it('emits update:websiteUrl when Website input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const websiteInput = wrapper.find('#website-url');
    await websiteInput.setValue('https://example.com');

    expect(wrapper.emitted('update:websiteUrl')).toBeTruthy();
    expect(wrapper.emitted('update:websiteUrl')?.[0]).toEqual(['https://example.com']);
  });

  it('emits update:twitterHandle when Twitter input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const twitterInput = wrapper.find('#twitter-handle');
    await twitterInput.setValue('myleague');

    expect(wrapper.emitted('update:twitterHandle')).toBeTruthy();
    expect(wrapper.emitted('update:twitterHandle')?.[0]).toEqual(['myleague']);
  });

  it('emits update:instagramHandle when Instagram input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const instagramInput = wrapper.find('#instagram-handle');
    await instagramInput.setValue('myleague');

    expect(wrapper.emitted('update:instagramHandle')).toBeTruthy();
    expect(wrapper.emitted('update:instagramHandle')?.[0]).toEqual(['myleague']);
  });

  it('emits update:youtubeUrl when YouTube input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const youtubeInput = wrapper.find('#youtube-url');
    await youtubeInput.setValue('https://youtube.com/@myleague');

    expect(wrapper.emitted('update:youtubeUrl')).toBeTruthy();
    expect(wrapper.emitted('update:youtubeUrl')?.[0]).toEqual(['https://youtube.com/@myleague']);
  });

  it('emits update:twitchUrl when Twitch input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const twitchInput = wrapper.find('#twitch-url');
    await twitchInput.setValue('https://twitch.tv/myleague');

    expect(wrapper.emitted('update:twitchUrl')).toBeTruthy();
    expect(wrapper.emitted('update:twitchUrl')?.[0]).toEqual(['https://twitch.tv/myleague']);
  });

  it('displays Discord URL value', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        discordUrl: 'https://discord.gg/test',
      },
    });

    const discordInput = wrapper.find('#discord-url');
    expect(discordInput.exists()).toBe(true);
  });

  it('displays Website URL value', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        websiteUrl: 'https://test.com',
      },
    });

    const websiteInput = wrapper.find('#website-url');
    expect(websiteInput.exists()).toBe(true);
  });

  it('displays error for Discord URL', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        errors: {
          discord_url: 'Invalid Discord URL',
        },
      },
    });

    expect(wrapper.text()).toContain('Invalid Discord URL');

    const discordInput = wrapper.find('#discord-url');
    const classes = discordInput.attributes('class') || '';
    expect(classes).toContain('p-invalid');
  });

  it('displays error for Website URL', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        errors: {
          website_url: 'Invalid Website URL',
        },
      },
    });

    expect(wrapper.text()).toContain('Invalid Website URL');

    const websiteInput = wrapper.find('#website-url');
    const classes = websiteInput.attributes('class') || '';
    expect(classes).toContain('p-invalid');
  });

  it('displays error for Twitter handle', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        errors: {
          twitter_handle: 'Invalid Twitter handle',
        },
      },
    });

    expect(wrapper.text()).toContain('Invalid Twitter handle');

    const twitterInput = wrapper.find('#twitter-handle');
    const classes = twitterInput.attributes('class') || '';
    expect(classes).toContain('p-invalid');
  });

  it('displays placeholder text for all inputs', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const discordInput = wrapper.find('#discord-url');
    expect(discordInput.attributes('placeholder')).toContain('discord.gg');

    const websiteInput = wrapper.find('#website-url');
    expect(websiteInput.attributes('placeholder')).toContain('league-website.com');

    const twitterInput = wrapper.find('#twitter-handle');
    expect(twitterInput.attributes('placeholder')).toBe('yourleague');

    const instagramInput = wrapper.find('#instagram-handle');
    expect(instagramInput.attributes('placeholder')).toBe('yourleague');
  });

  it('handles all errors simultaneously', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        errors: {
          discord_url: 'Discord error',
          website_url: 'Website error',
          twitter_handle: 'Twitter error',
          instagram_handle: 'Instagram error',
          youtube_url: 'YouTube error',
          twitch_url: 'Twitch error',
        },
      },
    });

    expect(wrapper.text()).toContain('Discord error');
    expect(wrapper.text()).toContain('Website error');
    expect(wrapper.text()).toContain('Twitter error');
    expect(wrapper.text()).toContain('Instagram error');
    expect(wrapper.text()).toContain('YouTube error');
    expect(wrapper.text()).toContain('Twitch error');
  });
});
