import React from 'react';
import { useRetryProcessingMutation } from '../services/backendApi';

const ArticleDetail = ({ article, onBack }) => {
  const [retryProcessing] = useRetryProcessingMutation();

  const handleRetry = async () => {
    try {
      await retryProcessing(article._id).unwrap();
      alert('Processing restarted');
    } catch (err) {
      alert('Failed to restart processing');
    }
  };

  // Debug: Check what data we're receiving
  //console.log('Article detail received:', article);

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <button
        onClick={onBack}
        className='mb-4 text-blue-500 hover:text-blue-700 flex items-center'
      >
        ← Back to list
      </button>

      <div className='flex justify-between items-start mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>{article.title}</h1>
          <p className='text-gray-600 mt-2'>
            {article.authors?.join(', ') || 'Unknown authors'} • {article.publicationYear || 'Unknown year'}
          </p>
          <p className='text-gray-500'>{article.journal}</p>
        </div>
        
        <div className='flex items-center gap-2'>
          <span className={`px-3 py-1 rounded-full text-sm ${
            article.processingStatus === 'completed' 
              ? 'bg-green-100 text-green-800'
              : article.processingStatus === 'processing'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {article.processingStatus}
          </span>
          
          {article.processingStatus === 'failed' && (
            <button
              onClick={handleRetry}
              className='px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600'
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {article.errorMessage && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-red-800 mb-2'>Error</h3>
          <p className='text-red-600'>{article.errorMessage}</p>
        </div>
      )}

      {/* Debug info. Just for debugging. Uncomment to test */}
      {/*
      {article.summary && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-blue-800 mb-2'>Debug: Summary Structure</h3>
          <pre className='text-xs text-blue-600 overflow-auto'>
            {JSON.stringify(article.summary, null, 2)}
          </pre>
        </div>
      )}
        */}

      {article.summary && (
        <div className='space-y-6'>
          {article.summary.abstract && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Abstract</h3>
              <p className='text-gray-700'>{article.summary.abstract}</p>
            </div>
          )}
          
          {article.summary.methodology && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Methodology</h3>
              <p className='text-gray-700'>{article.summary.methodology}</p>
            </div>
          )}
          
          {article.summary.keyFindings && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Key Findings</h3>
              <p className='text-gray-700'>{article.summary.keyFindings}</p>
            </div>
          )}
          
          {article.summary.proposedWayForward && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Proposed Way Forward</h3>
              <p className='text-gray-700'>{article.summary.proposedWayForward}</p>
            </div>
          )}
          
          {article.summary.additionalInsights && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Additional Insights</h3>
              <p className='text-gray-700'>{article.summary.additionalInsights}</p>
            </div>
          )}
          
          {article.summary.overallSummary && (
            <div>
              <h3 className='font-semibold text-gray-800 mb-2'>Overall Summary</h3>
              <p className='text-gray-700'>{article.summary.overallSummary}</p>
            </div>
          )}
        </div>
      )}

      {(!article.summary || Object.keys(article.summary).length === 0) && article.processingStatus === 'completed' && (
        <div className='text-center py-8 text-gray-500'>
          No summary available. The article processing may have completed but no summary was generated.
          {article.errorMessage && (
            <div className='mt-4 text-red-600'>
              Error: {article.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;