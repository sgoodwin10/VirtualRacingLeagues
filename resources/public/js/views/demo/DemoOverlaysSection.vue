<script setup lang="ts">
import { ref } from 'vue';
import VrlHeading from '@public/components/common/typography/VrlHeading.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlModal from '@public/components/common/overlays/modals/VrlModal.vue';
import VrlDrawer from '@public/components/common/overlays/drawers/VrlDrawer.vue';
import VrlDialog from '@public/components/common/overlays/dialogs/VrlDialog.vue';
import VrlToast from '@public/components/common/overlays/toasts/VrlToast.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlSelect from '@public/components/common/forms/VrlSelect.vue';
import { useToast } from '@public/composables/useToast';
import {
  PhRectangle,
  PhArrowsOut,
  PhArrowRight,
  PhArrowLeft,
  PhCheckCircle,
  PhWarning,
  PhTrash,
  PhInfo,
} from '@phosphor-icons/vue';

// Modal state
const showModalSm = ref(false);
const showModalMd = ref(false);
const showModalLg = ref(false);
const showModalFull = ref(false);

// Drawer state
const showDrawerRight = ref(false);
const showDrawerLeft = ref(false);

// Dialog state
const showDialogSuccess = ref(false);
const showDialogWarning = ref(false);
const showDialogDanger = ref(false);
const showDialogInfo = ref(false);

// Form inputs for demos
const exampleField = ref('');
const firstName = ref('');
const lastName = ref('');
const platformFilter = ref('all');
const statusFilter = ref('all');

// Toast
const toast = useToast();

const showSuccessToast = () => {
  toast.success('Your changes have been saved successfully.');
};

const showInfoToast = () => {
  toast.info('New results are available.');
};

const showWarningToast = () => {
  toast.warn('Session expiring in 5 minutes.');
};

const showErrorToast = () => {
  toast.error('Failed to save changes.');
};

// Dialog handlers
const handleConfirm = () => {
  toast.success('Action confirmed!');
};

const handleCancel = () => {
  toast.info('Action cancelled.');
};
</script>

<template>
  <section id="overlays" class="space-y-8">
    <div class="text-center mb-12">
      <VrlHeading :level="2" variant="section" class="mb-4">Overlays</VrlHeading>
      <p class="theme-text-muted max-w-2xl mx-auto">
        Modal dialogs, drawers, toasts, and overlay components for focused user interactions.
      </p>
    </div>

    <!-- Modals -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-secondary">Modals</VrlHeading>
      <p class="theme-text-muted text-sm mb-4">
        Modal dialogs with multiple sizes, customizable header/footer, and full accessibility
        support.
      </p>

      <div class="theme-card p-6 rounded-sm">
        <div class="flex flex-wrap gap-3">
          <VrlButton variant="primary" size="sm" @click="showModalSm = true">
            <PhRectangle :size="16" weight="bold" class="mr-2" />
            Small Modal
          </VrlButton>
          <VrlButton variant="primary" size="sm" @click="showModalMd = true">
            <PhRectangle :size="16" weight="bold" class="mr-2" />
            Medium Modal
          </VrlButton>
          <VrlButton variant="primary" size="sm" @click="showModalLg = true">
            <PhRectangle :size="16" weight="bold" class="mr-2" />
            Large Modal
          </VrlButton>
          <VrlButton variant="primary" size="sm" @click="showModalFull = true">
            <PhArrowsOut :size="16" weight="bold" class="mr-2" />
            Fullscreen
          </VrlButton>
        </div>
      </div>
    </div>

    <!-- Drawers -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-secondary">Drawers</VrlHeading>
      <p class="theme-text-muted text-sm mb-4">
        Slide-out panels from left or right edges. Perfect for filters, details, or navigation.
      </p>

      <div class="theme-card p-6 rounded-sm">
        <div class="flex flex-wrap gap-3">
          <VrlButton variant="secondary" size="sm" @click="showDrawerRight = true">
            <PhArrowRight :size="16" weight="bold" class="mr-2" />
            Right Drawer
          </VrlButton>
          <VrlButton variant="secondary" size="sm" @click="showDrawerLeft = true">
            <PhArrowLeft :size="16" weight="bold" class="mr-2" />
            Left Drawer
          </VrlButton>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-secondary"
        >Confirmation Dialogs</VrlHeading
      >
      <p class="theme-text-muted text-sm mb-4">
        Alert and confirmation dialogs with semantic variants for success, warning, danger, and
        info.
      </p>

      <div class="theme-card p-6 rounded-sm">
        <div class="flex flex-wrap gap-3">
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-success hover:!bg-racing-success/10"
            @click="showDialogSuccess = true"
          >
            <PhCheckCircle :size="16" weight="fill" class="mr-2" />
            Success
          </VrlButton>
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-warning hover:!bg-racing-warning/10"
            @click="showDialogWarning = true"
          >
            <PhWarning :size="16" weight="fill" class="mr-2" />
            Warning
          </VrlButton>
          <VrlButton variant="danger-outline" size="sm" @click="showDialogDanger = true">
            <PhTrash :size="16" weight="fill" class="mr-2" />
            Delete Confirm
          </VrlButton>
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-info hover:!bg-racing-info/10"
            @click="showDialogInfo = true"
          >
            <PhInfo :size="16" weight="fill" class="mr-2" />
            Info
          </VrlButton>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="space-y-6">
      <VrlHeading :level="3" variant="card" class="theme-text-secondary"
        >Toast Notifications</VrlHeading
      >
      <p class="theme-text-muted text-sm mb-4">
        Non-blocking notifications that auto-dismiss. Use the useToast composable for programmatic
        control.
      </p>

      <div class="theme-card p-6 rounded-sm">
        <div class="flex flex-wrap gap-3">
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-success hover:!bg-racing-success/10"
            @click="showSuccessToast"
          >
            <PhCheckCircle :size="16" weight="fill" class="mr-2" />
            Success Toast
          </VrlButton>
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-info hover:!bg-racing-info/10"
            @click="showInfoToast"
          >
            <PhInfo :size="16" weight="fill" class="mr-2" />
            Info Toast
          </VrlButton>
          <VrlButton
            variant="ghost"
            size="sm"
            class="!text-racing-warning hover:!bg-racing-warning/10"
            @click="showWarningToast"
          >
            <PhWarning :size="16" weight="fill" class="mr-2" />
            Warning Toast
          </VrlButton>
          <VrlButton variant="danger-outline" size="sm" @click="showErrorToast">
            Error Toast
          </VrlButton>
        </div>
      </div>
    </div>

    <!-- Modal Components -->
    <VrlModal v-model="showModalSm" title="Small Modal" size="sm">
      <p class="theme-text-muted text-sm">
        This is a small modal dialog. Perfect for simple confirmations or short messages.
      </p>
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showModalSm = false">Close</VrlButton>
      </template>
    </VrlModal>

    <VrlModal v-model="showModalMd" title="Medium Modal" size="md">
      <p class="theme-text-muted text-sm mb-4">
        This is the default modal size. Suitable for forms and moderate content.
      </p>
      <VrlInput
        v-model="exampleField"
        label="Example Field"
        placeholder="Enter value..."
        class="mb-4"
      />
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showModalMd = false">Cancel</VrlButton>
        <VrlButton variant="primary" size="sm" @click="showModalMd = false">Save</VrlButton>
      </template>
    </VrlModal>

    <VrlModal v-model="showModalLg" title="Large Modal" size="lg">
      <p class="theme-text-muted text-sm mb-4">
        Large modals are ideal for complex forms or detailed information.
      </p>
      <div class="grid grid-cols-2 gap-4">
        <VrlInput v-model="firstName" label="First Name" placeholder="Enter first name..." />
        <VrlInput v-model="lastName" label="Last Name" placeholder="Enter last name..." />
      </div>
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showModalLg = false">Cancel</VrlButton>
        <VrlButton variant="primary" size="sm" @click="showModalLg = false">Submit</VrlButton>
      </template>
    </VrlModal>

    <VrlModal v-model="showModalFull" title="Fullscreen Modal" size="full">
      <div class="h-full flex items-center justify-center">
        <p class="theme-text-muted text-sm">
          Fullscreen modals take up the entire viewport. Perfect for immersive experiences or
          complex workflows.
        </p>
      </div>
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showModalFull = false">Close</VrlButton>
      </template>
    </VrlModal>

    <!-- Drawer Components -->
    <VrlDrawer v-model="showDrawerRight" title="Right Drawer" position="right">
      <p class="theme-text-muted text-sm mb-4">
        Right-side drawers are commonly used for detail views, settings panels, or secondary
        actions.
      </p>
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded theme-bg-tertiary">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center theme-bg-primary theme-text-dim"
          >
            <span class="font-display text-sm">AC</span>
          </div>
          <div>
            <div class="font-display text-xs uppercase theme-text-primary">Alex Chen</div>
            <div class="font-data text-[10px] theme-text-muted">Driver #1</div>
          </div>
        </div>
      </div>
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showDrawerRight = false">Close</VrlButton>
        <VrlButton variant="primary" size="sm" @click="showDrawerRight = false"
          >View Profile</VrlButton
        >
      </template>
    </VrlDrawer>

    <VrlDrawer v-model="showDrawerLeft" title="Filter Results" position="left">
      <p class="theme-text-muted text-sm mb-4">
        Left-side drawers work well for navigation menus, filters, or category selection.
      </p>
      <div class="space-y-4">
        <VrlSelect
          v-model="platformFilter"
          label="Platform"
          :options="[
            { label: 'All Platforms', value: 'all' },
            { label: 'GT7', value: 'gt7' },
            { label: 'ACC', value: 'acc' },
            { label: 'iRacing', value: 'iracing' },
          ]"
          placeholder="Select platform"
        />
        <VrlSelect
          v-model="statusFilter"
          label="Status"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
          ]"
          placeholder="Select status"
        />
      </div>
      <template #footer>
        <VrlButton variant="ghost" size="sm" @click="showDrawerLeft = false">Reset</VrlButton>
        <VrlButton variant="primary" size="sm" @click="showDrawerLeft = false"
          >Apply Filters</VrlButton
        >
      </template>
    </VrlDrawer>

    <!-- Dialog Components -->
    <VrlDialog
      v-model="showDialogSuccess"
      variant="success"
      title="Success!"
      message="Your league has been created successfully."
      confirm-only
      @confirm="handleConfirm"
    />

    <VrlDialog
      v-model="showDialogWarning"
      variant="warning"
      title="Warning"
      message="You have unsaved changes. Are you sure you want to leave?"
      confirm-label="Leave"
      cancel-label="Stay"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <VrlDialog
      v-model="showDialogDanger"
      variant="danger"
      title="Delete League?"
      message="This action cannot be undone. All data will be permanently deleted."
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <VrlDialog
      v-model="showDialogInfo"
      variant="info"
      title="New Feature"
      message="You can now export your standings to CSV format from the settings menu."
      confirm-only
      @confirm="handleConfirm"
    />

    <!-- Toast Component (rendered once) -->
    <VrlToast position="top-right" />
  </section>
</template>
