<template>
  <div class="points-progression-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from 'chart.js';
import type { SeasonStandingDriver } from '@public/types/public';
import { useTheme } from '@public/composables/useTheme';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Round {
  round_id: number;
  round_number: number;
  name: string;
}

interface Props {
  drivers: SeasonStandingDriver[];
  rounds: Round[];
}

const props = defineProps<Props>();

// Theme support
const { theme } = useTheme();

// Template ref - will be HTMLCanvasElement when mounted
// eslint-disable-next-line no-undef
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Get theme-aware colors
const getThemeColors = () => {
  const isDark = theme.value === 'dark';
  return {
    textPrimary: isDark ? 'rgba(250, 250, 250, 0.9)' : 'rgba(10, 10, 10, 0.9)',
    textSecondary: isDark ? 'rgba(250, 250, 250, 0.6)' : 'rgba(10, 10, 10, 0.6)',
    textMuted: isDark ? 'rgba(250, 250, 250, 0.7)' : 'rgba(10, 10, 10, 0.7)',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)',
    tooltipBg: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipTitle: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 10, 10, 0.9)',
    tooltipBody: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(10, 10, 10, 0.8)',
    tooltipBorder: isDark ? 'rgba(212, 168, 83, 0.3)' : 'rgba(212, 168, 83, 0.5)',
  };
};

// Color palette for drivers (works on both light and dark backgrounds, 30 distinct colors)
const driverColors = [
  '#D4A853', // Racing Gold
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#65A30D', // Lime (darker for light mode)
  '#F43F5E', // Rose
  '#0891B2', // Sky (darker for light mode)
  '#CA8A04', // Yellow (darker for light mode)
  '#84CC16', // Light Lime
  '#2DD4BF', // Light Teal
  '#FB7185', // Light Rose
  '#9333EA', // Purple (darker)
  '#2563EB', // Blue (darker)
  '#059669', // Green (darker)
  '#B45309', // Gold (darker)
  '#DB2777', // Pink (darker)
  '#0284C7', // Sky (darker)
  '#16A34A', // Bright Green
  '#C026D3', // Fuchsia
  '#4F46E5', // Indigo (darker)
  '#EA580C', // Orange (darker)
  '#7C3AED', // Violet (darker)
];

// Generate chart data
const generateChartData = () => {
  // X-axis labels (round numbers)
  const labels = props.rounds.map((r) => r.name);

  // Create datasets for each driver (all drivers included)
  const datasets = props.drivers.map((driver, index) => {
    // Calculate cumulative points for each round
    const cumulativePoints: number[] = [];
    let runningTotal = 0;

    props.rounds.forEach((round) => {
      // Find the round data for this driver
      const roundData = driver.rounds.find((r) => r.round_id === round.round_id);
      if (roundData) {
        runningTotal += roundData.points;
      }
      cumulativePoints.push(runningTotal);
    });

    const color = driverColors[index % driverColors.length];

    return {
      label: driver.driver_name,
      data: cumulativePoints,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: false,
    };
  });

  return {
    labels,
    datasets,
  };
};

// Chart configuration
const createChartConfig = (): ChartConfiguration<'line'> => {
  const colors = getThemeColors();

  return {
    type: 'line',
    data: generateChartData(),
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: colors.textPrimary,
            font: {
              family: 'var(--font-body)',
              size: 12,
            },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
          },
          onClick: (_e, legendItem, _legend) => {
            // Toggle visibility of dataset when legend item is clicked
            const index = legendItem.datasetIndex;
            if (index !== undefined && chartInstance) {
              const meta = chartInstance.getDatasetMeta(index);
              const dataset = chartInstance.data.datasets[index];
              if (dataset) {
                // Toggle hidden state - Chart.js uses null to represent visible
                const isCurrentlyHidden = meta.hidden !== null ? meta.hidden : !!dataset.hidden;
                meta.hidden = !isCurrentlyHidden;
              }
              chartInstance.update();
            }
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (context) => {
              return context[0]?.label || '';
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed?.y ?? 0;
              return `${label}: ${value} pts`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: colors.gridColor,
            drawTicks: false,
          },
          ticks: {
            color: colors.textSecondary,
            font: {
              family: 'var(--font-body)',
              size: 11,
            },
            padding: 8,
          },
          border: {
            color: colors.borderColor,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            drawTicks: false,
          },
          ticks: {
            color: colors.textSecondary,
            font: {
              family: 'var(--font-data)',
              size: 11,
            },
            padding: 8,
          },
          border: {
            color: colors.borderColor,
          },
          title: {
            display: true,
            text: 'Points',
            color: colors.textMuted,
            font: {
              family: 'var(--font-body)',
              size: 12,
              weight: 'bold',
            },
          },
        },
      },
    },
  };
};

// Initialize chart
const initChart = () => {
  const canvas = chartCanvas.value;
  if (!canvas) return;

  // Destroy existing chart if any
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
  }

  // Create new chart
  const config = createChartConfig();
  chartInstance = new Chart(canvas, config);
};

// Update chart when data changes
const updateChart = () => {
  if (!chartInstance || typeof chartInstance.update !== 'function') {
    initChart();
    return;
  }

  // Update data
  const newData = generateChartData();
  chartInstance.data.labels = newData.labels;
  chartInstance.data.datasets = newData.datasets;
  chartInstance.update();
};

// Lifecycle hooks
onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
    chartInstance = null;
  }
});

// Watch for data changes - use shallow comparison for performance
watch(
  () => ({
    driverCount: props.drivers.length,
    roundCount: props.rounds.length,
    // Hash of driver IDs to detect actual data changes
    driverHash: props.drivers.map((d) => d.driver_id).join(','),
    // Hash of round IDs to detect actual data changes
    roundHash: props.rounds.map((r) => r.round_id).join(','),
  }),
  () => {
    updateChart();
  },
);

// Watch for theme changes - reinitialize chart to apply new colors
watch(theme, () => {
  initChart();
});
</script>

<style scoped>
.points-progression-chart {
  width: 100%;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-top: var(--space-xl);
}

canvas {
  width: 100% !important;
  height: auto !important;
}

@media (max-width: 768px) {
  .points-progression-chart {
    padding: var(--space-lg);
  }
}
</style>
