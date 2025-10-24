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

/* eslint-disable vue/one-component-per-file */

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
      type: [Boolean, Array, String, Number] as PropType<boolean | unknown[] | string | number>,
      default: false,
    },
    value: {
      type: [String, Number, Boolean, Object] as PropType<
        string | number | boolean | Record<string, unknown>
      >,
      default: null,
    },
    binary: Boolean,
    disabled: Boolean,
    invalid: Boolean,
    trueValue: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      default: true,
    },
    falseValue: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
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
      let newValue: boolean | unknown[] | string | number;

      if (this.binary) {
        newValue = target.checked ? this.trueValue : this.falseValue;
      } else if (Array.isArray(this.modelValue)) {
        if (target.checked) {
          newValue = [...this.modelValue, this.value];
        } else {
          newValue = this.modelValue.filter((v) => v !== this.value);
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
      type: Array as PropType<Record<string, unknown>[]>,
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
      type: Array as PropType<Record<string, unknown>[]>,
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
 * Editor Component Stub
 * Rich text editor component
 */
export const EditorStub = defineComponent({
  name: 'Editor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    editorStyle: {
      type: String,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    readonly: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'text-change', 'selection-change'],
  methods: {
    handleInput(event: Event): void {
      const target = event.target as HTMLTextAreaElement;
      this.$emit('update:modelValue', target.value);
    },
  },
  template: `
    <div class="p-editor-container" :class="{ 'p-invalid': $attrs.class && $attrs.class.includes('p-invalid') }">
      <div class="p-editor-toolbar">
        <slot name="toolbar"></slot>
      </div>
      <div class="p-editor-content">
        <textarea
          :value="modelValue"
          :placeholder="placeholder"
          :readonly="readonly"
          :disabled="disabled"
          @input="handleInput"
        ></textarea>
      </div>
    </div>
  `,
});

/**
 * FileUpload Component Stub
 * File upload component
 */
export const FileUploadStub = defineComponent({
  name: 'FileUpload',
  props: {
    mode: {
      type: String as PropType<'basic' | 'advanced'>,
      default: 'advanced',
    },
    name: {
      type: String,
      default: undefined,
    },
    url: {
      type: String,
      default: undefined,
    },
    multiple: Boolean,
    accept: {
      type: String,
      default: undefined,
    },
    maxFileSize: {
      type: Number,
      default: undefined,
    },
    disabled: Boolean,
    auto: Boolean,
    chooseLabel: {
      type: String,
      default: 'Choose',
    },
  },
  emits: ['select', 'upload', 'before-upload', 'progress', 'error', 'clear'],
  methods: {
    clear(): void {
      this.$emit('clear');
    },
  },
  template: `
    <div class="p-fileupload" :class="$attrs.class">
      <div class="p-fileupload-buttonbar">
        <label class="p-button p-fileupload-choose">
          {{ chooseLabel }}
          <input type="file" :accept="accept" :disabled="disabled" @change="$emit('select', { files: $event.target.files })" />
        </label>
      </div>
    </div>
  `,
});

/**
 * Select Component Stub (replaces deprecated Dropdown)
 * Select dropdown component
 */
export const SelectStub = defineComponent({
  name: 'PrimeSelect',
  props: {
    modelValue: {
      type: [String, Number, Boolean, Object, null] as PropType<
        string | number | boolean | Record<string, unknown> | null
      >,
      default: null,
    },
    options: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    optionLabel: {
      type: [String, Function] as PropType<string | ((option: unknown) => string)>,
      default: undefined,
    },
    optionValue: {
      type: [String, Function] as PropType<string | ((option: unknown) => unknown)>,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    disabled: Boolean,
    filter: Boolean,
    showClear: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  template: `
    <div class="p-select" :class="$attrs.class">
      <select
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="(option, index) in options" :key="index" :value="optionValue ? option[optionValue] : option">
          {{ optionLabel ? (typeof optionLabel === 'function' ? optionLabel(option) : option[optionLabel]) : option }}
        </option>
      </select>
    </div>
  `,
});

/**
 * Dropdown Component Stub (deprecated, use Select instead)
 * @deprecated Use SelectStub instead
 */
export const DropdownStub = SelectStub;

/**
 * MultiSelect Component Stub
 * Multi-select dropdown component
 */
export const MultiSelectStub = defineComponent({
  name: 'MultiSelect',
  props: {
    modelValue: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    options: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    optionLabel: {
      type: [String, Function] as PropType<string | ((option: unknown) => string)>,
      default: undefined,
    },
    optionValue: {
      type: [String, Function] as PropType<string | ((option: unknown) => unknown)>,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    disabled: Boolean,
    filter: Boolean,
    maxSelectedLabels: {
      type: Number,
      default: undefined,
    },
    display: {
      type: String as PropType<'comma' | 'chip'>,
      default: 'comma',
    },
  },
  emits: ['update:modelValue', 'change'],
  template: `
    <div class="p-multiselect" :class="$attrs.class">
      <div class="p-multiselect-label-container">
        <div class="p-multiselect-trigger">
          <span class="p-multiselect-trigger-icon"></span>
        </div>
      </div>
    </div>
  `,
});

/**
 * DataView Component Stub
 * Data display component
 */
export const DataViewStub = defineComponent({
  name: 'DataView',
  props: {
    value: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    layout: {
      type: String as PropType<'list' | 'grid'>,
      default: 'list',
    },
    dataKey: {
      type: String,
      default: undefined,
    },
    loading: Boolean,
  },
  template: `
    <div class="p-dataview">
      <div v-if="loading" class="p-dataview-loading">Loading...</div>
      <div v-else-if="!value || value.length === 0" class="p-dataview-empty">
        <slot name="empty">No records found</slot>
      </div>
      <div v-else class="p-dataview-content">
        <slot name="list" :items="value">
          <div v-for="(item, index) in value" :key="dataKey ? item[dataKey] : index">
            {{ item }}
          </div>
        </slot>
      </div>
    </div>
  `,
});

/**
 * Tag Component Stub
 * Tag/badge component
 */
export const TagStub = defineComponent({
  name: 'Tag',
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
    severity: {
      type: String as PropType<
        'success' | 'info' | 'warn' | 'warning' | 'danger' | 'secondary' | 'contrast'
      >,
      default: undefined,
    },
    rounded: Boolean,
    icon: {
      type: String,
      default: undefined,
    },
  },
  template: `
    <span :class="['p-tag', severity && 'p-tag-' + severity, rounded && 'p-tag-rounded']">
      <span v-if="icon" :class="['p-tag-icon', icon]"></span>
      <span class="p-tag-value">
        <slot>{{ value }}</slot>
      </span>
    </span>
  `,
});

/**
 * Stepper Component Stub
 * Stepper container component
 */
export const StepperStub = defineComponent({
  name: 'Stepper',
  props: {
    value: {
      type: Number,
      default: 0,
    },
    linear: Boolean,
  },
  emits: ['update:value'],
  template: `
    <div class="p-stepper">
      <slot></slot>
    </div>
  `,
});

/**
 * StepList Component Stub
 */
export const StepListStub = defineComponent({
  name: 'StepList',
  template: `
    <div class="p-steplist">
      <slot></slot>
    </div>
  `,
});

/**
 * Step Component Stub
 */
export const StepStub = defineComponent({
  name: 'Step',
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
  },
  template: `
    <div class="p-step">
      <slot></slot>
    </div>
  `,
});

/**
 * StepPanels Component Stub
 */
export const StepPanelsStub = defineComponent({
  name: 'StepPanels',
  template: `
    <div class="p-steppanels">
      <slot></slot>
    </div>
  `,
});

/**
 * StepPanel Component Stub
 */
export const StepPanelStub = defineComponent({
  name: 'StepPanel',
  props: {
    value: {
      type: [String, Number],
      default: undefined,
    },
  },
  template: `
    <div class="p-steppanel">
      <slot></slot>
    </div>
  `,
});

/**
 * Drawer Component Stub
 * Side panel/drawer component
 */
export const DrawerStub = defineComponent({
  name: 'Drawer',
  props: {
    visible: Boolean,
    position: {
      type: String as PropType<'left' | 'right' | 'top' | 'bottom'>,
      default: 'left',
    },
    modal: {
      type: Boolean,
      default: true,
    },
    showCloseIcon: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:visible', 'show', 'hide'],
  template: `
    <div v-if="visible" :class="['p-drawer', 'p-drawer-' + position, $attrs.class]">
      <div class="p-drawer-header">
        <slot name="header"></slot>
        <button v-if="showCloseIcon" class="p-drawer-close" @click="$emit('update:visible', false)">×</button>
      </div>
      <div class="p-drawer-content">
        <slot></slot>
      </div>
    </div>
  `,
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
  Editor: EditorStub,
  FileUpload: FileUploadStub,
  Select: SelectStub,
  Dropdown: DropdownStub, // Deprecated: for backwards compatibility
  MultiSelect: MultiSelectStub,
  DataView: DataViewStub,
  Tag: TagStub,
  Stepper: StepperStub,
  StepList: StepListStub,
  Step: StepStub,
  StepPanels: StepPanelsStub,
  StepPanel: StepPanelStub,
  Drawer: DrawerStub,
};
