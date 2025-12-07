<template>
  <footer class="footer-racing">
    <div class="container-racing">
      <div class="footer-content">
        <!-- Brand Column -->
        <div class="footer-brand">
          <router-link to="/" class="footer-logo">
            <div class="nav-logo-icon">
              <PhFlag :size="20" weight="fill" color="#0a0a0a" />
            </div>
            <span class="footer-logo-text">Virtual Racing Leagues</span>
          </router-link>
          <p class="footer-description">
            The complete platform for sim racing league management. Create competitions,
            track results, and share standings with your community.
          </p>
        </div>

        <!-- Product Column -->
        <div class="footer-column">
          <h4 class="footer-title">Product</h4>
          <ul class="footer-links">
            <li><router-link to="/#features">Features</router-link></li>
            <li><router-link to="/leagues">Public Leagues</router-link></li>
            <li><router-link to="/#pricing">Pricing</router-link></li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div class="footer-column">
          <h4 class="footer-title">Resources</h4>
          <ul class="footer-links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Support</a></li>
          </ul>
        </div>

        <!-- Legal Column -->
        <div class="footer-column">
          <h4 class="footer-title">Legal</h4>
          <ul class="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Virtual Racing Leagues. All rights reserved.</p>
        <div class="footer-social">
          <a href="#" class="social-link" aria-label="Discord">
            <PhDiscordLogo :size="20" />
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <PhTwitterLogo :size="20" />
          </a>
          <a href="#" class="social-link" aria-label="YouTube">
            <PhYoutubeLogo :size="20" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PhFlag, PhDiscordLogo, PhTwitterLogo, PhYoutubeLogo } from '@phosphor-icons/vue';

const currentYear = computed(() => new Date().getFullYear());
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
  color: var(--color-pit-white);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.footer-column {
  min-width: 120px;
}

.footer-social {
  display: flex;
  gap: var(--space-md);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-tarmac);
  color: var(--color-barrier);
  transition: all var(--duration-fast);
}

.social-link:hover {
  background: var(--color-gold);
  color: var(--color-carbon);
}
</style>
