import { ref } from 'vue';
import { debounce } from 'lodash-es';
import type { TrackLocationGroup } from '@app/types/track';
import { useTrackStore } from '@app/stores/trackStore';

export function useTrackSearch() {
  const trackStore = useTrackStore();
  const searchResults = ref<TrackLocationGroup[]>([]);
  const searching = ref(false);

  const performSearch = debounce(async (platformId: number, query: string) => {
    if (!query || query.trim().length === 0) {
      searchResults.value = [];
      searching.value = false;
      return;
    }

    searching.value = true;
    try {
      const results = await trackStore.searchTracks(platformId, query.trim());
      searchResults.value = results;
    } catch (error) {
      console.error('Track search failed:', error);
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 300);

  function search(platformId: number, query: string): void {
    performSearch(platformId, query);
  }

  function clearSearch(): void {
    searchResults.value = [];
    searching.value = false;
    performSearch.cancel();
  }

  return {
    searchResults,
    searching,
    search,
    clearSearch,
  };
}
