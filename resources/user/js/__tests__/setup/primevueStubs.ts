/**
 * Centralized PrimeVue Component Stubs for Testing
 *
 * This file provides properly functioning stub components for all PrimeVue components
 * used in user dashboard tests. Each stub:
 * - Accepts all relevant props
 * - Properly handles v-model with update:modelValue
 * - Emits all necessary events
 * - Supports slots
 * - Is queryable by component name
 */

import { defineComponent, type PropType } from 'vue';

/**
 * Button Component Stub
 * Supports: label, icon, severity, loading, click events
 */
export const PrimeButtonStub = defineComponent({
  name: 'PrimeButton',
  props: {
    label: {
      type: String,
      default: undefined,
    },
    icon: {
      type: String,
      default: undefined,
    },
    severity: {
      type: String as PropType<
        'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
      >,
      default: undefined,
    },
    loading: Boolean,
    disabled: Boolean,
    outlined: Boolean,
    text: Boolean,
    raised: Boolean,
    rounded: Boolean,
    size: {
      type: String as PropType<'small' | 'large'>,
      default: undefined,
    },
  },
  emits: ['click'],
  template: `
    <button
      v-bind="$attrs"
      :disabled="loading || disabled"
      :class="['p-button', severity && 'p-button-' + severity]"
      @click="$emit('click', $event)"
    >
      <span v-if="icon && !loading" :class="icon"></span>
      <span v-if="loading" class="p-button-loading-icon"></span>
      <slot>{{ label }}</slot>
    </button>
  `,
});

/**
 * InputText Component Stub
 * Supports: v-model, placeholder, disabled
 */
export const InputTextStub = defineComponent({
  name: 'InputText',
  props: {
    modelValue: {
      type: [String, Number, null] as PropType<string | number | null>,
      default: '',
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    disabled: Boolean,
    type: {
      type: String,
      default: 'text',
    },
    size: {
      type: String as PropType<'small' | 'large'>,
      default: undefined,
    },
    invalid: Boolean,
  },
  emits: ['update:modelValue', 'input', 'blur', 'focus'],
  methods: {
    handleInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      this.$emit('update:modelValue', target.value);
      this.$emit('input', event);
    },
  },
  template: `
    <input
      v-bind="$attrs"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['p-inputtext', invalid && 'p-invalid']"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
  `,
});

/**
 * Password Component Stub
 * Supports: v-model, placeholder, disabled, feedback
 */
export const PasswordStub = defineComponent({
  name: 'Password',
  props: {
    modelValue: {
      type: [String, null] as PropType<string | null>,
      default: '',
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    disabled: Boolean,
    feedback: {
      type: Boolean,
      default: true,
    },
    toggleMask: Boolean,
    invalid: Boolean,
  },
  emits: ['update:modelValue', 'input', 'blur', 'focus'],
  methods: {
    handleInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      this.$emit('update:modelValue', target.value);
      this.$emit('input', event);
    },
  },
  template: `
    <input
      v-bind="$attrs"
      type="password"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['p-password', invalid && 'p-invalid']"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
  `,
});

/**
 * Checkbox Component Stub
 * Supports: v-model, binary, trueValue, falseValue
 */
export const CheckboxStub = defineComponent({
  name: 'Checkbox',
  props: {
    modelValue: {
      type: [Boolean, Array, String, Number] as PropType<boolean | any[] | string | number>,
      default: false,
    },
    value: {
      type: [String, Number, Boolean, Object] as PropType<any>,
      default: null,
    },
    binary: Boolean,
    disabled: Boolean,
    invalid: Boolean,
    trueValue: {
      type: [String, Number, Boolean] as PropType<any>,
      default: true,
    },
    falseValue: {
      type: [String, Number, Boolean] as PropType<any>,
      default: false,
    },
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    isChecked(): boolean {
      if (this.binary) {
        return this.modelValue === this.trueValue;
      }
      if (Array.isArray(this.modelValue)) {
        return this.modelValue.includes(this.value);
      }
      return Boolean(this.modelValue);
    },
  },
  methods: {
    handleChange(event: Event): void {
      const target = event.target as HTMLInputElement;
      let newValue: any;

      if (this.binary) {
        newValue = target.checked ? this.trueValue : this.falseValue;
      } else if (Array.isArray(this.modelValue)) {
        if (target.checked) {
          newValue = [...this.modelValue, this.value];
        } else {
          newValue = this.modelValue.filter((v: any) => v !== this.value);
        }
      } else {
        newValue = target.checked;
      }

      this.$emit('update:modelValue', newValue);
      this.$emit('change', { checked: target.checked, value: newValue });
    },
  },
  template: `
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      :class="['p-checkbox', invalid && 'p-invalid']"
      @change="handleChange"
    />
  `,
});

/**
 * Card Component Stub
 * Supports: title, subtitle, slots (header, title, subtitle, content, footer)
 */
export const CardStub = defineComponent({
  name: 'Card',
  props: {
    title: {
      type: String,
      default: undefined,
    },
    subtitle: {
      type: String,
      default: undefined,
    },
  },
  template: `
    <div class="p-card">
      <div v-if="$slots.header" class="p-card-header">
        <slot name="header"></slot>
      </div>
      <div class="p-card-body">
        <div v-if="title || $slots.title" class="p-card-title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div v-if="subtitle || $slots.subtitle" class="p-card-subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
        <div class="p-card-content">
          <slot></slot>
          <slot name="content"></slot>
        </div>
      </div>
      <div v-if="$slots.footer" class="p-card-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  `,
});

/**
 * Toast Component Stub
 * Basic stub for toast notifications
 */
export const ToastStub = defineComponent({
  name: 'Toast',
  props: {
    group: {
      type: String,
      default: undefined,
    },
    position: {
      type: String as PropType<
        | 'top-left'
        | 'top-center'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-center'
        | 'bottom-right'
        | 'center'
      >,
      default: undefined,
    },
    autoZIndex: Boolean,
    baseZIndex: {
      type: Number,
      default: undefined,
    },
    breakpoints: {
      type: Object,
      default: undefined,
    },
  },
  template: '<div class="p-toast"></div>',
});

/**
 * Menubar Component Stub
 * Navigation menu component
 */
export const MenubarStub = defineComponent({
  name: 'Menubar',
  props: {
    model: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
  },
  template: `
    <nav class="p-menubar">
      <div v-if="$slots.start" class="p-menubar-start">
        <slot name="start"></slot>
      </div>
      <ul class="p-menubar-root-list">
        <li v-for="(item, index) in model" :key="index" class="p-menubar-item">
          <slot name="item" :item="item" :props="{ action: {} }">
            <a :href="item.url" class="p-menubar-item-link">
              <span v-if="item.icon" :class="item.icon"></span>
              <span class="p-menubar-item-label">{{ item.label }}</span>
            </a>
          </slot>
        </li>
      </ul>
      <div v-if="$slots.end" class="p-menubar-end">
        <slot name="end"></slot>
      </div>
    </nav>
  `,
});

/**
 * Message Component Stub
 * Inline message component
 */
export const MessageStub = defineComponent({
  name: 'Message',
  props: {
    severity: {
      type: String as PropType<'success' | 'info' | 'warn' | 'error'>,
      default: undefined,
    },
    closable: {
      type: Boolean,
      default: true,
    },
    life: {
      type: Number,
      default: undefined,
    },
  },
  emits: ['close'],
  template: `
    <div :class="['p-message', severity && 'p-message-' + severity]">
      <div class="p-message-wrapper">
        <slot></slot>
      </div>
      <button v-if="closable" class="p-message-close" @click="$emit('close')">×</button>
    </div>
  `,
});

/**
 * Menu Component Stub
 * Popup menu component
 */
export const MenuStub = defineComponent({
  name: 'PrimeMenu',
  props: {
    model: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    popup: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    toggle(_event: Event): void {
      // Mock toggle behavior for tests
    },
    show(_event: Event): void {
      // Mock show behavior for tests
    },
    hide(): void {
      // Mock hide behavior for tests
    },
  },
  template: `
    <div class="p-menu">
      <ul class="p-menu-list">
        <li v-for="(item, index) in model" :key="index" class="p-menu-item">
          <a v-if="!item.separator" class="p-menu-item-link" @click="item.command && item.command()">
            <span v-if="item.icon" :class="item.icon"></span>
            <span class="p-menu-item-label">{{ item.label }}</span>
          </a>
          <hr v-else class="p-menu-separator" />
        </li>
      </ul>
    </div>
  `,
});

/**
 * ConfirmDialog Component Stub
 * Confirmation dialog component
 */
export const ConfirmDialogStub = defineComponent({
  name: 'ConfirmDialog',
  props: {
    group: {
      type: String,
      default: undefined,
    },
  },
  template: '<div class="p-confirm-dialog"></div>',
});

/**
 * Complete stub mappings for all PrimeVue components
 */
export const primevueStubs = {
  Button: PrimeButtonStub,
  InputText: InputTextStub,
  Password: PasswordStub,
  Checkbox: CheckboxStub,
  Card: CardStub,
  Toast: ToastStub,
  Menubar: MenubarStub,
  Message: MessageStub,
  Menu: MenuStub,
  ConfirmDialog: ConfirmDialogStub,
};
