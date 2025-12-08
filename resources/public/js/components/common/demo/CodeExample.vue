<script setup lang="ts">
/**
 * CodeExample - Code snippet display component with copy functionality
 *
 * @component
 * @example
 * ```vue
 * <CodeExample
 *   title="Basic Button"
 *   :code="`<VrlButton variant=\"primary\">Click Me</VrlButton>`"
 * />
 * ```
 */
import { ref } from 'vue';
import { PhCopy, PhCheck } from '@phosphor-icons/vue';

interface Props {
  /**
   * Code snippet to display
   */
  code: string;
  /**
   * Optional title for the code example
   */
  title?: string;
  /**
   * Programming language for syntax (currently visual only)
   * @default 'vue'
   */
  language?: 'vue' | 'typescript' | 'javascript';
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  language: 'vue',
});

const copied = ref(false);

/**
 * Copy code to clipboard
 */
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
};
</script>

<template>
  <div class="code-example theme-bg-tertiary rounded overflow-hidden border theme-border">
    <!-- Header -->
    <div
      v-if="title"
      class="code-example-header px-4 py-2 theme-bg-secondary border-b theme-border flex items-center justify-between"
    >
      <h5 class="font-display text-[10px] uppercase tracking-wider theme-text-secondary">
        {{ title }}
      </h5>
      <span class="text-[9px] theme-text-dim uppercase">{{ language }}</span>
    </div>

    <!-- Code Block -->
    <div class="relative group">
      <pre
        class="code-block p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed"
      ><code class="font-mono theme-text-primary">{{ code }}</code></pre>

      <!-- Copy Button -->
      <button
        class="copy-button absolute top-2 right-2 p-2 rounded theme-bg-secondary theme-border border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-racing-gold/10 hover:border-racing-gold/30"
        :class="{ 'opacity-100': copied }"
        :aria-label="copied ? 'Copied!' : 'Copy code'"
        @click="copyCode"
      >
        <PhCheck v-if="copied" :size="16" class="text-racing-success" weight="bold" />
        <PhCopy v-else :size="16" class="theme-text-muted" weight="bold" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  /* Custom scrollbar for code blocks */
  scrollbar-width: thin;
  scrollbar-color: var(--bg-elevated) var(--bg-tertiary);
}

.code-block::-webkit-scrollbar {
  height: 8px;
}

.code-block::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.code-block::-webkit-scrollbar-thumb {
  background: var(--bg-elevated);
  border-radius: 4px;
}

.code-block::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gold-muted);
}

.copy-button {
  backdrop-filter: blur(8px);
}
</style>
