import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Track, TrackLocationGroup, TrackSearchParams } from '@user/types/track';
import * as trackService from '@user/services/trackService';

export const useTrackStore = defineStore('track', () => {
  // State
  const tracks = ref<Track[]>([]);
  const trackLocations = ref<TrackLocationGroup[]>([]);
  const currentTrack = ref<Track | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const tracksByPlatformId = computed(() => {
    return (platformId: number) => tracks.value.filter((track) => track.platform_id === platformId);
  });

  const getTrackById = computed(() => {
    return (trackId: number) => tracks.value.find((track) => track.id === trackId);
  });

  const trackLocationById = computed(() => {
    return (trackLocationId: number) =>
      trackLocations.value.find((location) => location.id === trackLocationId);
  });

  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

  // Actions
  async function fetchTracks(params: TrackSearchParams): Promise<TrackLocationGroup[]> {
    loading.value = true;
    error.value = null;
    try {
      const locationGroups = await trackService.getTracks(params);

      // Ensure locationGroups is an array
      if (!Array.isArray(locationGroups)) {
        console.error(
          'Expected locationGroups to be an array, got:',
          typeof locationGroups,
          locationGroups,
        );
        throw new Error('Invalid response format from tracks API');
      }

      // Flatten all tracks from location groups
      const allTracks = locationGroups.flatMap((group) => group.tracks);

      // Replace tracks for this platform
      tracks.value = [
        ...tracks.value.filter((t) => t.platform_id !== params.platform_id),
        ...allTracks,
      ];

      // Store location groups
      trackLocations.value = locationGroups;

      return locationGroups;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tracks';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchTracks(platformId: number, search: string): Promise<TrackLocationGroup[]> {
    const params: TrackSearchParams = {
      platform_id: platformId,
      search,
      is_active: true,
    };
    return await fetchTracks(params);
  }

  async function fetchTrack(trackId: number): Promise<Track> {
    loading.value = true;
    error.value = null;
    try {
      const data = await trackService.getTrack(trackId);
      currentTrack.value = data;
      // Update in tracks array if exists
      const index = tracks.value.findIndex((t) => t.id === trackId);
      if (index !== -1) {
        tracks.value[index] = data;
      } else {
        tracks.value.push(data);
      }
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch track';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearCurrentTrack(): void {
    currentTrack.value = null;
  }

  function $reset(): void {
    tracks.value = [];
    trackLocations.value = [];
    currentTrack.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    tracks,
    trackLocations,
    currentTrack,
    loading,
    error,
    // Getters
    tracksByPlatformId,
    getTrackById,
    trackLocationById,
    isLoading,
    hasError,
    // Actions
    fetchTracks,
    searchTracks,
    fetchTrack,
    clearError,
    clearCurrentTrack,
    $reset,
  };
});
