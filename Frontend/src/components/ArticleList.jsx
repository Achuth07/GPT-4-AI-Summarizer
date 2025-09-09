import React, { useState } from 'react';
import { 
  useGetArticlesQuery, 
  useDeleteArticleMutation,
  useGetArticleByIdQuery
} from '../services/backendApi';
import ArticleDetail from './ArticleDetail';

const ArticleList = () => {
  const [page, setPage] = useState(1);
  const [selectedArticleId, setSelectedArticleId] = useState(null); // Store ID instead of full article
  const { data, error, isLoading } = useGetArticlesQuery({ page, limit: 10 });
  const { data: fullArticle } = useGetArticleByIdQuery(selectedArticleId, {
    skip: !selectedArticleId, // Only fetch when we have an ID
  });
  const [deleteArticle] = useDeleteArticleMutation();

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(id).unwrap();
        alert('Article deleted successfully');
      } catch (err) {
        alert('Failed to delete article');
      }
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading articles...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error loading articles</div>;

  return (
    <section className='mt-8 w-full max-w-4xl mx-auto'>
      {selectedArticleId && fullArticle ? (
        <ArticleDetail 
          article={fullArticle} 
          onBack={() => setSelectedArticleId(null)}
        />
      ) : (
        <>
          <h2 className='text-2xl font-bold text-gray-800 mb-6'>Recent Articles</h2>
          
          <div className='grid gap-4'>
            {data?.articles?.map((article) => (
              <div key={article._id} className='bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-800 truncate'>{article.title}</h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      {article.authors?.join(', ') || 'Unknown authors'} • {article.publicationYear || 'Unknown year'}
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>{article.journal}</p>
                    <div className='flex items-center mt-2'>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        article.processingStatus === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : article.processingStatus === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {article.processingStatus}
                      </span>
                      <span className='text-xs text-gray-500 ml-2'>
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className='flex gap-2 ml-4'>
                    <button
                      onClick={() => setSelectedArticleId(article._id)} // Set ID instead of full article
                      className='px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600'
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className='px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Some Pagination */}
          {data?.totalPages > 1 && (
            <div className='flex justify-center mt-8 gap-2'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-4 py-2 bg-gray-200 rounded disabled:opacity-50'
              >
                Previous
              </button>
              
              <span className='px-4 py-2'>
                Page {page} of {data.totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className='px-4 py-2 bg-gray-200 rounded disabled:opacity-50'
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ArticleList;