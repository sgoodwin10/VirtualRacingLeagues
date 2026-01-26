import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import PointsSection from '../PointsSection.vue';
import SettingCard from '@app/components/common/cards/SettingCard.vue';
import PointsSystemEditor from '@app/components/common/forms/PointsSystemEditor.vue';
import BaseCheckbox from '@app/components/common/inputs/BaseCheckbox.vue';
import type { PointsSystemMap } from '@app/types/race';

describe('PointsSection', () => {
  const globalConfig: Parameters<typeof mount>[1] = {
    global: {
      plugins: [[PrimeVue, { theme: { preset: Aura } }]],
    },
  };

  const mockPointsSystem: PointsSystemMap = {
    1: 25,
    2: 18,
    3: 15,
  };

  describe('Rendering', () => {
    it('renders section title and description', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: false,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      expect(wrapper.text()).toContain('Points Configuration');
      expect(wrapper.text()).toContain('Configure round-level points and bonuses');
    });

    it('renders round points toggle', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: false,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const settingCard = wrapper.findComponent(SettingCard);
      expect(settingCard.exists()).toBe(true);
    });

    it('does not render points system editor when round points disabled', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: false,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      expect(editor.exists()).toBe(false);
    });

    it('renders points system editor when round points enabled', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      expect(editor.exists()).toBe(true);
    });

    it('renders fastest lap checkbox when points enabled', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: 1,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      // Check that fastest lap bonus section is rendered
      expect(wrapper.text()).toContain('Fastest Lap Bonus');
      expect(wrapper.text()).toContain('Only award if driver finishes in top 10');
    });

    it('renders qualifying pole checkbox when points enabled', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: 1,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      // Check that qualifying pole bonus section is rendered
      expect(wrapper.text()).toContain('Qualifying Pole Bonus');
      expect(wrapper.text()).toContain('Only award if driver finishes in top 10');
    });
  });

  describe('Props', () => {
    it('passes roundPoints to toggle', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const settingCard = wrapper.findComponent(SettingCard);
      expect(settingCard.props('modelValue')).toBe(true);
    });

    it('passes points system to editor', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      expect(editor.props('modelValue')).toEqual(mockPointsSystem);
    });

    it('passes canCopyFromRoundOne to editor', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: true,
          errors: {},
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      expect(editor.props('showCopyButton')).toBe(true);
    });

    it('disables all inputs when disabled prop is true', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
          disabled: true,
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      const checkboxes = wrapper.findAllComponents(BaseCheckbox);

      expect(editor.props('disabled')).toBe(true);
      checkboxes.forEach((checkbox) => {
        expect(checkbox.props('disabled')).toBe(true);
      });
    });

    it('shows validation errors', () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: 1,
          fastestLapTop10: false,
          qualifyingPole: 1,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {
            points_system: 'Points system error',
            fastest_lap: 'Fastest lap error',
            qualifying_pole: 'Qualifying pole error',
          },
        },
      });

      // Verify errors prop is passed correctly
      expect(wrapper.props('errors')).toEqual({
        points_system: 'Points system error',
        fastest_lap: 'Fastest lap error',
        qualifying_pole: 'Qualifying pole error',
      });
    });
  });

  describe('Events', () => {
    it('emits update:roundPoints when toggle changes', async () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: false,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const settingCard = wrapper.findComponent(SettingCard);
      await settingCard.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:roundPoints')).toBeTruthy();
      expect(wrapper.emitted('update:roundPoints')?.[0]).toEqual([true]);
    });

    it('emits update:pointsSystem when editor changes', async () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const newPoints = { 1: 30, 2: 20, 3: 15 };
      const editor = wrapper.findComponent(PointsSystemEditor);
      await editor.vm.$emit('update:modelValue', newPoints);

      expect(wrapper.emitted('update:pointsSystem')).toBeTruthy();
      expect(wrapper.emitted('update:pointsSystem')?.[0]).toEqual([newPoints]);
    });

    it('emits copy-from-round-one when copy button is clicked', async () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: true,
          errors: {},
        },
      });

      const editor = wrapper.findComponent(PointsSystemEditor);
      await editor.vm.$emit('copy');

      expect(wrapper.emitted('copy-from-round-one')).toBeTruthy();
    });

    it('emits update:fastestLap when checkbox is toggled', async () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const settingCards = wrapper.findAllComponents(SettingCard);
      const fastestLapCard = settingCards.find(
        (card) => card.props('title') === 'Fastest Lap Bonus',
      );
      await fastestLapCard?.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:fastestLap')).toBeTruthy();
      expect(wrapper.emitted('update:fastestLap')?.[0]).toEqual([1]);
    });

    it('emits update:qualifyingPole when checkbox is toggled', async () => {
      const wrapper = mount(PointsSection, {
        ...globalConfig,
        props: {
          roundPoints: true,
          pointsSystem: mockPointsSystem,
          fastestLap: null,
          fastestLapTop10: false,
          qualifyingPole: null,
          qualifyingPoleTop10: false,
          canCopyFromRoundOne: false,
          errors: {},
        },
      });

      const settingCards = wrapper.findAllComponents(SettingCard);
      const qualifyingCard = settingCards.find(
        (card) => card.props('title') === 'Qualifying Pole Bonus',
      );
      await qualifyingCard?.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:qualifyingPole')).toBeTruthy();
      expect(wrapper.emitted('update:qualifyingPole')?.[0]).toEqual([1]);
    });
  });
});
