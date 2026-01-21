/**
 * Centralized API Endpoints
 * All API endpoint paths are defined here for consistency and maintainability
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: () => '/login',
    logout: () => '/logout',
    me: () => '/me',
    resendVerificationEmail: () => '/email/resend',
    updateProfile: () => '/profile',
    impersonate: () => '/impersonate',
  },

  // League endpoints
  leagues: {
    list: () => '/leagues',
    detail: (id: number) => `/leagues/${id}`,
    create: () => '/leagues',
    update: (id: number) => `/leagues/${id}`,
    delete: (id: number) => `/leagues/${id}`,
    checkSlug: () => '/leagues/check-slug',
    driverColumns: (leagueId: number) => `/leagues/${leagueId}/driver-columns`,
    driverFormFields: (leagueId: number) => `/leagues/${leagueId}/driver-form-fields`,
    driverCsvHeaders: (leagueId: number) => `/leagues/${leagueId}/driver-csv-headers`,
    competitions: (leagueId: number) => `/leagues/${leagueId}/competitions`,
    drivers: (leagueId: number) => `/leagues/${leagueId}/drivers`,
    driverDetail: (leagueId: number, driverId: number) =>
      `/leagues/${leagueId}/drivers/${driverId}`,
    driverSeasons: (leagueId: number, leagueDriverId: number) =>
      `/leagues/${leagueId}/drivers/${leagueDriverId}/seasons`,
    importDriversCsv: (leagueId: number) => `/leagues/${leagueId}/drivers/import-csv`,
  },

  // Platform endpoints
  platforms: {
    list: () => '/platforms',
    raceSettings: (platformId: number) => `/platforms/${platformId}/race-settings`,
  },

  // Timezone endpoints
  timezones: {
    list: () => '/timezones',
  },

  // Competition endpoints
  competitions: {
    detail: (id: number) => `/competitions/${id}`,
    update: (id: number) => `/competitions/${id}`,
    archive: (id: number) => `/competitions/${id}/archive`,
    delete: (id: number) => `/competitions/${id}`,
    checkSlug: (leagueId: number) => `/leagues/${leagueId}/competitions/check-slug`,
    seasons: (competitionId: number) => `/competitions/${competitionId}/seasons`,
    checkSeasonSlug: (competitionId: number) => `/competitions/${competitionId}/seasons/check-slug`,
  },

  // Season endpoints
  seasons: {
    detail: (id: number) => `/seasons/${id}`,
    update: (id: number) => `/seasons/${id}`,
    archive: (id: number) => `/seasons/${id}/archive`,
    unarchive: (id: number) => `/seasons/${id}/unarchive`,
    activate: (id: number) => `/seasons/${id}/activate`,
    complete: (id: number) => `/seasons/${id}/complete`,
    reactivate: (id: number) => `/seasons/${id}/reactivate`,
    delete: (id: number) => `/seasons/${id}`,
    restore: (id: number) => `/seasons/${id}/restore`,
    rounds: (seasonId: number) => `/seasons/${seasonId}/rounds`,
    nextRoundNumber: (seasonId: number) => `/seasons/${seasonId}/rounds/next-number`,
    recalculateResults: (seasonId: number) => `/seasons/${seasonId}/recalculate-results`,
    teams: (seasonId: number) => `/seasons/${seasonId}/teams`,
    teamDetail: (seasonId: number, teamId: number) => `/seasons/${seasonId}/teams/${teamId}`,
    divisions: (seasonId: number) => `/seasons/${seasonId}/divisions`,
    divisionDetail: (seasonId: number, divisionId: number) =>
      `/seasons/${seasonId}/divisions/${divisionId}`,
    divisionDriverCount: (seasonId: number, divisionId: number) =>
      `/seasons/${seasonId}/divisions/${divisionId}/driver-count`,
    reorderDivisions: (seasonId: number) => `/seasons/${seasonId}/divisions/reorder`,
    seasonDrivers: (seasonId: number) => `/seasons/${seasonId}/drivers`,
    seasonDriverDetail: (seasonId: number, seasonDriverId: number) =>
      `/seasons/${seasonId}/drivers/${seasonDriverId}`,
    seasonDriverTeam: (seasonId: number, seasonDriverId: number) =>
      `/seasons/${seasonId}/drivers/${seasonDriverId}/team`,
    seasonDriverDivision: (seasonId: number, seasonDriverId: number) =>
      `/seasons/${seasonId}/drivers/${seasonDriverId}/division`,
    seasonDriverStats: (seasonId: number) => `/seasons/${seasonId}/drivers/stats`,
    availableDrivers: (seasonId: number) => `/seasons/${seasonId}/available-drivers`,
    standings: (seasonId: number) => `/seasons/${seasonId}/standings`,
  },

  // Round endpoints
  rounds: {
    detail: (id: number) => `/rounds/${id}`,
    update: (id: number) => `/rounds/${id}`,
    delete: (id: number) => `/rounds/${id}`,
    complete: (id: number) => `/rounds/${id}/complete`,
    uncomplete: (id: number) => `/rounds/${id}/uncomplete`,
    races: (roundId: number) => `/rounds/${roundId}/races`,
    qualifier: (roundId: number) => `/rounds/${roundId}/qualifier`,
    results: (roundId: number) => `/rounds/${roundId}/results`,
  },

  // Race endpoints
  races: {
    detail: (id: number) => `/races/${id}`,
    update: (id: number) => `/races/${id}`,
    delete: (id: number) => `/races/${id}`,
    results: (raceId: number) => `/races/${raceId}/results`,
    orphanedResults: (raceId: number) => `/races/${raceId}/orphaned-results`,
  },

  // Qualifier endpoints
  qualifiers: {
    update: (id: number) => `/qualifiers/${id}`,
    delete: (id: number) => `/qualifiers/${id}`,
  },

  // Track endpoints
  tracks: {
    list: () => '/tracks',
    detail: (id: number) => `/tracks/${id}`,
  },

  // Site configuration endpoints
  siteConfig: {
    get: () => '/site-config',
  },

  // Tiebreaker rules endpoints
  tiebreakerRules: {
    list: () => '/tiebreaker-rules',
    forSeason: (seasonId: number) => `/seasons/${seasonId}/tiebreaker-rules`,
    updateOrder: (seasonId: number) => `/seasons/${seasonId}/tiebreaker-rules`,
  },
} as const;
