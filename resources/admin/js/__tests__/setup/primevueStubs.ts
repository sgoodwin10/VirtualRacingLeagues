/* eslint-disable vue/no-reserved-component-names */
/* eslint-disable vue/one-component-per-file */
/* eslint-disable vue/require-default-prop */
/**
 * Centralized PrimeVue Component Stubs for Testing
 *
 * This file provides properly functioning stub components for all PrimeVue components
 * used in admin dashboard tests. Each stub:
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
export const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    label: String,
    icon: String,
    severity: String as PropType<
      'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
    >,
    loading: Boolean,
    disabled: Boolean,
    outlined: Boolean,
    text: Boolean,
    raised: Boolean,
    rounded: Boolean,
    size: String as PropType<'small' | 'large'>,
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
 * Select/Dropdown Component Stub
 * Supports: v-model, options, optionLabel, optionValue, placeholder
 */
export const SelectStub = defineComponent({
  name: 'Select',
  props: {
    modelValue: {
      type: [String, Number, Object, null] as PropType<string | number | object | null>,
      default: null,
    },
    options: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    optionLabel: {
      type: String,
      default: 'label',
    },
    optionValue: {
      type: String,
      default: 'value',
    },
    placeholder: String,
    disabled: Boolean,
    loading: Boolean,
    showClear: Boolean,
    filter: Boolean,
    filterPlaceholder: String,
    emptyMessage: String,
    emptyFilterMessage: String,
  },
  emits: ['update:modelValue', 'change'],
  methods: {
    handleChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const value = target.value;

      // Find the actual option object if optionValue is specified
      let actualValue = value;
      if (this.options.length > 0 && typeof this.options[0] === 'object') {
        const option = this.options.find((opt) => String(opt[this.optionValue]) === value);
        actualValue = option || value;
      }

      this.$emit('update:modelValue', actualValue);
      this.$emit('change', { value: actualValue });
    },
  },
  template: `
    <select
      v-bind="$attrs"
      :value="typeof modelValue === 'object' && modelValue !== null ? modelValue[optionValue] : modelValue"
      :disabled="disabled || loading"
      class="p-select"
      @change="handleChange"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option
        v-for="(option, index) in options"
        :key="typeof option === 'object' ? option[optionValue] || index : option"
        :value="typeof option === 'object' ? option[optionValue] : option"
      >
        {{ typeof option === 'object' ? option[optionLabel] : option }}
      </option>
    </select>
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
    placeholder: String,
    disabled: Boolean,
    type: {
      type: String,
      default: 'text',
    },
    size: String as PropType<'small' | 'large'>,
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
 * Card Component Stub
 * Supports: title, subtitle, slots (header, title, subtitle, content, footer)
 */
export const CardStub = defineComponent({
  name: 'Card',
  props: {
    title: String,
    subtitle: String,
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
    group: String,
    position: String as PropType<
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right'
      | 'center'
    >,
    autoZIndex: Boolean,
    baseZIndex: Number,
    breakpoints: Object,
  },
  template: '<div class="p-toast"></div>',
});

/**
 * ConfirmDialog Component Stub
 * Basic stub for confirmation dialogs
 */
export const ConfirmDialogStub = defineComponent({
  name: 'ConfirmDialog',
  props: {
    group: String,
    breakpoints: Object,
  },
  template: '<div class="p-confirmdialog"></div>',
});

/**
 * IconField Component Stub
 * Wrapper component for input fields with icons
 */
export const IconFieldStub = defineComponent({
  name: 'IconField',
  props: {
    iconPosition: {
      type: String as PropType<'left' | 'right'>,
      default: 'left',
    },
  },
  template: `
    <div :class="['p-icon-field', 'p-icon-field-' + iconPosition]">
      <slot></slot>
    </div>
  `,
});

/**
 * InputIcon Component Stub
 * Icon display component
 */
export const InputIconStub = defineComponent({
  name: 'InputIcon',
  props: {
    class: String,
  },
  template: `
    <span :class="['p-input-icon', $attrs.class]">
      <slot></slot>
    </span>
  `,
});

/**
 * Skeleton Component Stub
 * Loading state placeholder
 */
export const SkeletonStub = defineComponent({
  name: 'Skeleton',
  props: {
    shape: {
      type: String as PropType<'rectangle' | 'circle'>,
      default: 'rectangle',
    },
    size: String,
    width: String,
    height: String,
    borderRadius: String,
  },
  template: `
    <div
      :class="['p-skeleton', 'p-skeleton-' + shape]"
      :style="{
        width: width || size,
        height: height || size,
        borderRadius: borderRadius
      }"
    ></div>
  `,
});

/**
 * DataTable Component Stub
 * Table component for displaying data
 */
export const DataTableStub = defineComponent({
  name: 'DataTable',
  props: {
    value: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    lazy: Boolean,
    paginator: Boolean,
    rows: Number,
    totalRecords: Number,
    loading: Boolean,
    sortField: String,
    sortOrder: Number,
    filters: Object,
    filterDisplay: String,
    globalFilterFields: Array as PropType<string[]>,
    emptyMessage: String,
    rowHover: Boolean,
    showGridlines: Boolean,
    stripedRows: Boolean,
  },
  emits: ['page', 'sort', 'filter', 'row-click', 'row-select', 'row-unselect'],
  template: `
    <div class="p-datatable">
      <table>
        <thead>
          <slot name="header"></slot>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="100%">Loading...</td>
          </tr>
          <tr v-else-if="!value || value.length === 0">
            <td colspan="100%">{{ emptyMessage || 'No records found' }}</td>
          </tr>
          <tr
            v-else
            v-for="(item, index) in value"
            :key="index"
            @click="$emit('row-click', { data: item, index })"
          >
            <slot :data="item" :index="index"></slot>
          </tr>
        </tbody>
        <tfoot v-if="$slots.footer">
          <slot name="footer"></slot>
        </tfoot>
      </table>
      <div v-if="paginator" class="p-paginator">
        <slot name="paginator"></slot>
      </div>
    </div>
  `,
});

/**
 * Column Component Stub
 * Table column definition
 */
export const ColumnStub = defineComponent({
  name: 'Column',
  props: {
    field: String,
    header: String,
    sortable: Boolean,
    filterField: String,
    filterMatchMode: String,
    showFilterMenu: Boolean,
    style: [String, Object],
    class: String,
  },
  template: '<th :class="$attrs.class"><slot>{{ header }}</slot></th>',
});

/**
 * Dialog Component Stub
 * Modal dialog component
 */
export const DialogStub = defineComponent({
  name: 'Dialog',
  props: {
    visible: Boolean,
    modal: Boolean,
    header: String,
    closable: {
      type: Boolean,
      default: true,
    },
    dismissableMask: Boolean,
    maximizable: Boolean,
    breakpoints: Object,
    draggable: Boolean,
    position: String as PropType<
      | 'center'
      | 'top'
      | 'bottom'
      | 'left'
      | 'right'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
    >,
  },
  emits: ['update:visible', 'hide', 'show'],
  methods: {
    close(): void {
      this.$emit('update:visible', false);
      this.$emit('hide');
    },
  },
  template: `
    <div v-if="visible" class="p-dialog-wrapper">
      <div class="p-dialog">
        <div class="p-dialog-header">
          <slot name="header">{{ header }}</slot>
          <button v-if="closable" class="p-dialog-close" @click="close">×</button>
        </div>
        <div class="p-dialog-content">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="p-dialog-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  `,
});

/**
 * Message Component Stub
 * Inline message component
 */
export const MessageStub = defineComponent({
  name: 'Message',
  props: {
    severity: String as PropType<'success' | 'info' | 'warn' | 'error'>,
    closable: {
      type: Boolean,
      default: true,
    },
    life: Number,
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
 * Complete stub mappings for all PrimeVue components
 */
export const primevueStubs = {
  Button: ButtonStub,
  Select: SelectStub,
  Dropdown: SelectStub, // Dropdown is an alias for Select in PrimeVue
  InputText: InputTextStub,
  Card: CardStub,
  Toast: ToastStub,
  ConfirmDialog: ConfirmDialogStub,
  IconField: IconFieldStub,
  InputIcon: InputIconStub,
  Skeleton: SkeletonStub,
  DataTable: DataTableStub,
  Column: ColumnStub,
  Dialog: DialogStub,
  Message: MessageStub,
};
