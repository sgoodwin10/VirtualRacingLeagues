<script setup lang="ts">
import type { NoteBoxProps } from './types';

const props = defineProps<NoteBoxProps>();
</script>

<template>
  <div
    :class="[
      'note-box',
      'bg-card border border-[var(--border)] rounded-r-[var(--radius)] px-5 py-4 mt-6',
      props.class,
    ]"
    role="note"
    :aria-label="title"
  >
    <!-- Title -->
    <slot name="title">
      <div class="font-mono text-xs font-semibold tracking-wide text-[var(--cyan)] mb-2">
        {{ title }}
      </div>
    </slot>

    <!-- Content -->
    <div class="note-content text-md text-[var(--text-secondary)] leading-relaxed">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Left border accent (always cyan for note boxes) */
.note-box {
  border-left: 3px solid var(--cyan);
}

/* Inline code styling within note content */
.note-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--text-primary);
}

/* Preserve formatting for pre/code blocks */
.note-content :deep(pre) {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 8px 0;
}

.note-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* List styling within note content */
.note-content :deep(ul),
.note-content :deep(ol) {
  margin-left: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.note-content :deep(ul) {
  list-style-type: disc;
}

.note-content :deep(ol) {
  list-style-type: decimal;
}

.note-content :deep(li) {
  margin-bottom: 0.25rem;
}

/* Paragraph spacing */
.note-content :deep(p + p) {
  margin-top: 0.5rem;
}

/* Strong/bold text */
.note-content :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
