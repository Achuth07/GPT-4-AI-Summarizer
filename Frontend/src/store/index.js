import { configureStore } from '@reduxjs/toolkit';
import { articleApi } from '../services/article';
import { backendApi } from '../services/backendApi';

export const store = configureStore({
  reducer: {
    [articleApi.reducerPath]: articleApi.reducer,
    [backendApi.reducerPath]: backendApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      articleApi.middleware,
      backendApi.middleware
    ),
});

export default store;