import axios from 'axios';

const API_BASE_URL = process.env.VITE_BACKEND_URL/'api';

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/articles/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    if (error.response) {
      throw new Error(error.response.data.error || error.response.data.message || 'Upload failed');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Upload failed');
    }
  }
};