<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="error-icon-wrapper">
        <PhWarningOctagon :size="120" weight="duotone" class="error-icon" />
      </div>

      <h1 class="error-title">404 - Page Not Found</h1>

      <p class="error-message">The page you're looking for doesn't exist or has been moved.</p>

      <div class="error-actions">
        <router-link to="/" class="action-link">
          <VrlButton variant="primary" size="lg">
            <PhHouse :size="20" weight="bold" />
            Go to Home
          </VrlButton>
        </router-link>

        <router-link to="/leagues" class="action-link">
          <VrlButton variant="ghost" size="lg">
            <PhFlag :size="20" weight="bold" />
            Browse Leagues
          </VrlButton>
        </router-link>
      </div>

      <div class="help-text">
        <p>If you believe this is a mistake, please contact support.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWarningOctagon, PhHouse, PhFlag } from '@phosphor-icons/vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
</script>

<style scoped>
.not-found-page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl) var(--space-lg);
  background: var(--color-carbon);
  padding-top: calc(var(--header-height) + var(--space-4xl));
}

.not-found-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.error-icon-wrapper {
  margin-bottom: var(--space-lg);
}

.error-icon {
  color: var(--color-gold);
  opacity: 0.8;
  filter: drop-shadow(0 0 20px rgba(255, 190, 11, 0.3));
}

.error-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-pit-white);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.error-message {
  font-family: var(--font-body);
  font-size: 1.125rem;
  color: var(--color-barrier);
  margin: 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.action-link {
  text-decoration: none;
}

.help-text {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-tarmac);
}

.help-text p {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-barrier);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .error-icon {
    width: 80px;
    height: 80px;
  }

  .error-title {
    font-size: 2rem;
  }

  .error-message {
    font-size: 1rem;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-link {
    width: 100%;
  }

  .error-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .not-found-page {
    padding: var(--space-2xl) var(--space-md);
  }

  .error-title {
    font-size: 1.75rem;
  }
}
</style>
