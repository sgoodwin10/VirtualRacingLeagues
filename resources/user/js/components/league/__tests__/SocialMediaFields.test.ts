import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mountWithStubs } from '@user/__tests__/setup';
import SocialMediaFields from '../partials/SocialMediaFields.vue';

describe('SocialMediaFields', () => {
  const defaultProps = {
    discordUrl: '',
    websiteUrl: '',
    twitterHandle: '',
    instagramHandle: '',
    youtubeUrl: '',
    twitchUrl: '',
  };

  it('renders component with title', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Social Media Links');
  });

  it('shows only primary fields (Discord and Website) initially', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Discord field should be visible
    expect(wrapper.find('#discord-url').exists()).toBe(true);
    expect(wrapper.text()).toContain('Discord Server');

    // Website field should be visible
    expect(wrapper.find('#website-url').exists()).toBe(true);
    expect(wrapper.text()).toContain('Website');

    // Other fields should not be visible initially
    expect(wrapper.find('#twitter-handle').exists()).toBe(false);
    expect(wrapper.find('#instagram-handle').exists()).toBe(false);
    expect(wrapper.find('#youtube-url').exists()).toBe(false);
    expect(wrapper.find('#twitch-url').exists()).toBe(false);
  });

  it('displays expand button when all fields are empty', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const expandButton = wrapper.find('button');
    expect(expandButton.exists()).toBe(true);
    expect(expandButton.text()).toContain('Add Social Links');
  });

  it('displays "Show More" button when some fields have values but not expanded', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: {
        ...defaultProps,
        discordUrl: 'https://discord.gg/test',
      },
    });

    const expandButton = wrapper.find('button');
    expect(expandButton.text()).toContain('Show More');
  });

  it('expands to show all fields when expand button is clicked', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    // All fields should now be visible
    expect(wrapper.find('#discord-url').exists()).toBe(true);
    expect(wrapper.find('#website-url').exists()).toBe(true);
    expect(wrapper.find('#twitter-handle').exists()).toBe(true);
    expect(wrapper.find('#instagram-handle').exists()).toBe(true);
    expect(wrapper.find('#youtube-url').exists()).toBe(true);
    expect(wrapper.find('#twitch-url').exists()).toBe(true);
  });

  it('shows "Show Less" button when expanded', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    let expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    // Re-query the button after state change
    expandButton = wrapper.find('button');
    expect(expandButton.text()).toContain('Show Less');
  });

  it('collapses when "Show Less" button is clicked', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand first
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    expect(wrapper.find('#twitter-handle').exists()).toBe(true);

    // Collapse
    await expandButton.trigger('click');
    await nextTick();

    expect(wrapper.find('#twitter-handle').exists()).toBe(false);
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

    // Expand to show Twitter field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const twitterInput = wrapper.find('#twitter-handle');
    await twitterInput.setValue('myleague');

    expect(wrapper.emitted('update:twitterHandle')).toBeTruthy();
    expect(wrapper.emitted('update:twitterHandle')?.[0]).toEqual(['myleague']);
  });

  it('emits update:instagramHandle when Instagram input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand to show Instagram field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const instagramInput = wrapper.find('#instagram-handle');
    await instagramInput.setValue('myleague');

    expect(wrapper.emitted('update:instagramHandle')).toBeTruthy();
    expect(wrapper.emitted('update:instagramHandle')?.[0]).toEqual(['myleague']);
  });

  it('emits update:youtubeUrl when YouTube input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand to show YouTube field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const youtubeInput = wrapper.find('#youtube-url');
    await youtubeInput.setValue('https://youtube.com/@myleague');

    expect(wrapper.emitted('update:youtubeUrl')).toBeTruthy();
    expect(wrapper.emitted('update:youtubeUrl')?.[0]).toEqual(['https://youtube.com/@myleague']);
  });

  it('emits update:twitchUrl when Twitch input changes', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand to show Twitch field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

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

    // Expand to show Twitter field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Invalid Twitter handle');

    const twitterInput = wrapper.find('#twitter-handle');
    const classes = twitterInput.attributes('class') || '';
    expect(classes).toContain('p-invalid');
  });

  it('displays placeholder text for all inputs', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Check primary fields
    const discordInput = wrapper.find('#discord-url');
    expect(discordInput.attributes('placeholder')).toContain('discord.gg');

    const websiteInput = wrapper.find('#website-url');
    expect(websiteInput.attributes('placeholder')).toContain('league-website.com');

    // Expand and check other fields
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const twitterInput = wrapper.find('#twitter-handle');
    expect(twitterInput.attributes('placeholder')).toBe('yourleague');

    const instagramInput = wrapper.find('#instagram-handle');
    expect(instagramInput.attributes('placeholder')).toBe('yourleague');
  });

  it('shows @ symbol before Twitter handle input', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand to show Twitter field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const twitterContainer = wrapper.find('#twitter-handle').element.parentElement;
    expect(twitterContainer?.textContent).toContain('@');
  });

  it('shows @ symbol before Instagram handle input', async () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    // Expand to show Instagram field
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    const instagramContainer = wrapper.find('#instagram-handle').element.parentElement;
    expect(instagramContainer?.textContent).toContain('@');
  });

  it('displays help text', () => {
    const wrapper = mountWithStubs(SocialMediaFields, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Optional: Add links to your league');
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

    // Expand to see all errors
    const expandButton = wrapper.find('button');
    await expandButton.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Discord error');
    expect(wrapper.text()).toContain('Website error');
    expect(wrapper.text()).toContain('Twitter error');
    expect(wrapper.text()).toContain('Instagram error');
    expect(wrapper.text()).toContain('YouTube error');
    expect(wrapper.text()).toContain('Twitch error');
  });
});
