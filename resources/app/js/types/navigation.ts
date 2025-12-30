import type { Component } from 'vue';
import type { Season, SeasonCompetition } from '@app/types/season';

/**
 * Navigation item for the icon rail
 */
export interface NavItem {
  id: string;
  label: string;
  icon: Component;
  route?: string;
  action?: () => void;
  tooltip?: string;
}

/**
 * Navigation item for the sidebar
 */
export interface SidebarNavItem {
  id: string;
  to: string;
  icon: Component;
  label: string;
  tag?: string | number;
  tagVariant?: 'default' | 'warning';
}

/**
 * Navigation context - IDs extracted from route params
 */
export interface NavigationContext {
  leagueId: number | null;
  competitionId: number | null;
  seasonId: number | null;
}

/**
 * Competition context - includes data loaded from API
 */
export interface CompetitionContext extends NavigationContext {
  competitionName: string;
  seasonName: string;
  competition: SeasonCompetition | null;
  season: Season | null;
}
