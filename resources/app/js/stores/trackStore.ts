import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Track, TrackLocationGroup, TrackSearchParams } from '@app/types/track';
import * as trackService from '@app/services/trackService';
import { useCrudStore } from '@app/composables/useCrudStore';

export const useTrackStore = defineStore('track', () => {
  // Use CRUD composable
  const crud = useCrudStore<Track>();
  const {
    items: tracks,
    currentItem: currentTrack,
    loading,
    error,
    setLoading,
    setError,
    setCurrentItem,
    clearError,
    resetStore,
  } = crud;

  // Additional state
  const trackLocations = ref<TrackLocationGroup[]>([]);

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
    setLoading(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function searchTracks(platformId: number, search: string): Promise<TrackLocationGroup[]> {
    setLoading(true);
    setError(null);
    try {
      const params: TrackSearchParams = {
        platform_id: platformId,
        search,
        is_active: true,
      };

      // Fetch search results WITHOUT modifying the main tracks array
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

      // Extract tracks from search results and add any missing tracks to the store
      // This ensures searched tracks are available via getTrackById while preserving existing tracks
      const searchedTracks = locationGroups.flatMap((group) => group.tracks);
      searchedTracks.forEach((searchedTrack) => {
        const existingIndex = tracks.value.findIndex((t) => t.id === searchedTrack.id);
        if (existingIndex === -1) {
          // Track not in store yet, add it
          tracks.value.push(searchedTrack);
        } else {
          // Track already exists, update it with latest data
          tracks.value[existingIndex] = searchedTrack;
        }
      });

      // Return search results for display in autocomplete
      return locationGroups;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tracks');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrack(trackId: number): Promise<Track> {
    setLoading(true);
    setError(null);
    try {
      const data = await trackService.getTrack(trackId);
      setCurrentItem(data);
      // Update in tracks array if exists
      const index = tracks.value.findIndex((t) => t.id === trackId);
      if (index !== -1) {
        tracks.value[index] = data;
      } else {
        tracks.value.push(data);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch track');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearCurrentTrack(): void {
    setCurrentItem(null);
  }

  function $reset(): void {
    resetStore();
    trackLocations.value = [];
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
