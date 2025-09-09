import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'https://gpt-4-ai-summarizer-backend.onrender.com/api'; //Backend URL

export const backendApi = createApi({
  reducerPath: 'backendApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Article'],
  endpoints: (builder) => ({
    // Get all articles
    getArticles: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `articles?page=${page}&limit=${limit}`,
      providesTags: ['Article'],
    }),
    
    // Get single article by ID
    getArticleById: builder.query({
      query: (id) => `articles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Article', id }],
    }),
    
    // Upload PDF file
    uploadArticle: builder.mutation({
      query: (formData) => ({
        url: 'articles/upload',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Article'],
    }),
    
    // Search articles
    searchArticles: builder.query({
      query: ({ query, page = 1, limit = 10 }) => 
        `articles/search/${query}?page=${page}&limit=${limit}`,
      providesTags: ['Article'],
    }),
    
    // Update article
    updateArticle: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `articles/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Article', id }],
    }),
    
    // Delete article
    deleteArticle: builder.mutation({
      query: (id) => ({
        url: `articles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Article'],
    }),
    
    // Retry processing
    retryProcessing: builder.mutation({
      query: (id) => ({
        url: `articles/${id}/retry`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Article', id }],
    }),

    //Summarize from URL
    summarizeUrl: builder.mutation({
      query: (url) => ({
        url: 'articles/summarize-url',
        method: 'POST',
        body: { url },
      }),
      invalidatesTags: ['Article'],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleByIdQuery,
  useUploadArticleMutation,
  useSearchArticlesQuery,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useRetryProcessingMutation,
  useSummarizeUrlMutation,
} = backendApi;