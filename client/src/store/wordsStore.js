import { create } from 'zustand';
import { api } from '../api/client';

const useWordsStore = create((set) => ({
  buckets: { learning: 0, learned: 0, mastered: 0 },
  words:   [],
  loading: false,
  error:   null,

  fetchBuckets: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/words/buckets');
      set({ buckets: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchWords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/words');
      set({ words: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));

export default useWordsStore;
