<template>
  <footer class="footer-racing">
    <div class="container-racing">
      <div class="footer-content">
        <!-- Brand Column -->
        <div class="footer-brand">
          <router-link to="/" class="footer-logo">
            <div class="nav-logo-icon">
              <PhFlag :size="20" weight="fill" :color="iconColor" />
            </div>
            <span class="footer-logo-text theme-text-primary">Virtual Racing Leagues</span>
          </router-link>
          <p class="footer-description theme-text-muted">
            The complete platform for sim racing league management. Create competitions, track
            results, and share standings with your community.
          </p>
        </div>

        <!-- Product Column -->
        <div class="footer-column">
          <h4 class="footer-title theme-text-secondary">Product</h4>
          <ul class="footer-links">
            <li><router-link to="/#features" class="theme-text-muted">Features</router-link></li>
            <li>
              <router-link to="/leagues" class="theme-text-muted">Public Leagues</router-link>
            </li>
            <li><router-link to="/#pricing" class="theme-text-muted">Pricing</router-link></li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div class="footer-column">
          <h4 class="footer-title theme-text-secondary">Resources</h4>
          <ul class="footer-links">
            <li><a href="#" class="theme-text-muted">Documentation</a></li>
            <li><a href="#" class="theme-text-muted">API Reference</a></li>
            <li><a href="#" class="theme-text-muted">Support</a></li>
          </ul>
        </div>

        <!-- Legal Column -->
        <div class="footer-column">
          <h4 class="footer-title theme-text-secondary">Legal</h4>
          <ul class="footer-links">
            <li><a href="#" class="theme-text-muted">Privacy Policy</a></li>
            <li><a href="#" class="theme-text-muted">Terms of Service</a></li>
            <li><a href="#" class="theme-text-muted">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="theme-text-muted text-sm">
          &copy; {{ currentYear }} Virtual Racing Leagues. All rights reserved.
        </p>
        <div class="footer-social">
          <!-- eslint-disable vue/attribute-hyphenation -->
          <VrlIconButton
            icon="discord-logo"
            variant="rounded"
            size="sm"
            ariaLabel="Join our Discord"
          />
          <VrlIconButton
            icon="twitter-logo"
            variant="rounded"
            size="sm"
            ariaLabel="Follow us on Twitter"
          />
          <VrlIconButton
            icon="youtube-logo"
            variant="rounded"
            size="sm"
            ariaLabel="Subscribe on YouTube"
          />
          <!-- eslint-enable vue/attribute-hyphenation -->
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PhFlag } from '@phosphor-icons/vue';
import { useTheme } from '@public/composables/useTheme';
import VrlIconButton from '@public/components/common/buttons/VrlIconButton.vue';

const { theme } = useTheme();
const currentYear = computed(() => new Date().getFullYear());
const iconColor = computed(() => (theme.value === 'dark' ? '#0a0a0a' : '#fafafa'));
</script>

<style scoped>
.footer-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
}

.footer-logo-text {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.footer-description {
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-top: var(--space-md);
}

.footer-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: var(--space-sm);
}

.footer-links a {
  font-family: var(--font-body);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color var(--duration-fast);
}

.footer-links a:hover {
  color: var(--accent-gold);
}

.footer-column {
  min-width: 120px;
}

.footer-social {
  display: flex;
  gap: var(--space-sm);
}
</style>
