import React, { useState, useEffect } from 'react';
import {
  Image,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  Plus,
  X,
  Calendar,
  Tag,
  User,
  Book,
  FileImage
} from 'lucide-react';

interface ImageData {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  upload_date: string;
  is_active: boolean;
  extracted_text?: string;
  ai_analysis?: string;
  analysis_date?: string;
  description?: string;
  tags?: string;
  subject_id?: number;
  uploader_name?: string;
  subject_name?: string;
  dataUrl?: string; // For display with authentication
}

interface Subject {
  id: number;
  name: string;
  description?: string;
}

interface ImageListResponse {
  images: ImageData[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const ImageGallery: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; image: ImageData | null }>({
    isOpen: false,
    image: null
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; image: ImageData | null }>({
    isOpen: false,
    image: null
  });

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState<string>('');

  // Edit form state
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<string>('');

  useEffect(() => {
    loadSubjects();
    loadImages();
  }, [currentPage, selectedSubject, searchTerm]);

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('https://brainink-backend.onrender.com/study-area/academic/teachers/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view images');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12'
      });

      if (selectedSubject) {
        params.append('subject_id', selectedSubject);
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`https://brainink-backend.onrender.com/study-area/images-management/my-images?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: ImageListResponse = await response.json();

        // Fetch image data URLs for display with proper authentication
        const imagesWithDataUrls = await Promise.all(
          (data.images || []).map(async (image: ImageData) => {
            try {
              const fileResponse = await fetch(`https://brainink-backend.onrender.com/study-area/images-management/${image.id}/file`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (fileResponse.ok) {
                const blob = await fileResponse.blob();
                const dataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                return { ...image, dataUrl };
              } else {
                console.warn(`Failed to load image ${image.id}:`, fileResponse.status);
                return { ...image, dataUrl: null };
              }
            } catch (error) {
              console.warn(`Error loading image ${image.id}:`, error);
              return { ...image, dataUrl: null };
            }
          })
        );

        setImages(imagesWithDataUrls as ImageData[]);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || 0);
      } else {
        setError('Failed to load images');
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      if (uploadDescription.trim()) {
        formData.append('description', uploadDescription.trim());
      }

      if (uploadTags.trim()) {
        formData.append('tags', uploadTags.trim());
      }

      if (uploadSubjectId) {
        formData.append('subject_id', uploadSubjectId);
      }

      const response = await fetch('https://brainink-backend.onrender.com/study-area/images-management/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadModal(false);
        setUploadFile(null);
        setUploadDescription('');
        setUploadTags('');
        setUploadSubjectId('');
        loadImages();
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (imageId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to edit images');
        return;
      }

      const formData = new FormData();
      formData.append('description', editDescription);
      formData.append('tags', editTags);

      if (editSubjectId) {
        formData.append('subject_id', editSubjectId);
      }

      const response = await fetch(`https://brainink-backend.onrender.com/study-area/images-management/update/${imageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setEditModal({ isOpen: false, image: null });
        loadImages();
      } else {
        setError(data.message || 'Edit failed');
      }
    } catch (error) {
      console.error('Edit failed:', error);
      setError('Edit failed');
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to delete images');
        return;
      }

      const response = await fetch(`https://brainink-backend.onrender.com/study-area/images-management/delete/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        loadImages();
      } else {
        setError(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Delete failed');
    }
  };

  const openEditModal = (image: ImageData) => {
    setEditModal({ isOpen: true, image });
    setEditDescription(image.description || '');
    setEditTags(image.tags || '');
    setEditSubjectId(image.subject_id?.toString() || '');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileImage className="w-8 h-8 text-blue-600" />
                Image Gallery
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your uploaded images for analysis and grading
              </p>
            </div>
            <button
              onClick={() => setUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center text-gray-600">
              <span className="font-medium">{totalCount}</span>
              <span className="ml-1">images found</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Image Grid */}
        {images.length === 0 ? (
          <div className="text-center py-12">
            <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSubject
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first image to get started'
              }
            </p>
            <button
              onClick={() => setUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Upload First Image
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div key={image.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={image.dataUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'}
                      alt={image.original_filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => setViewModal({ isOpen: true, image })}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(image)}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate" title={image.original_filename}>
                      {image.original_filename}
                    </h3>

                    {image.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {image.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(image.upload_date)}
                      </span>
                      <span>{formatFileSize(image.file_size)}</span>
                    </div>

                    {image.subject_name && (
                      <div className="flex items-center gap-1 mt-2">
                        <Book className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">
                          {image.subject_name}
                        </span>
                      </div>
                    )}

                    {image.tags && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 truncate">
                          {image.tags}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upload Image</h2>
                  <button
                    onClick={() => setUploadModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      placeholder="Describe the image content..."
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (optional)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      placeholder="math, homework, quiz (comma separated)"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject (optional)
                    </label>
                    <select
                      value={uploadSubjectId}
                      onChange={(e) => setUploadSubjectId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setUploadModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModal.isOpen && viewModal.image && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {viewModal.image.original_filename}
                  </h2>
                  <button
                    onClick={() => setViewModal({ isOpen: false, image: null })}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image */}
                  <div>
                    <img
                      src={viewModal.image.dataUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0Q1RDlERCIvPgo8L3N2Zz4K'}
                      alt={viewModal.image.original_filename}
                      className="w-full rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">File size:</span>
                          <span>{formatFileSize(viewModal.image.file_size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Uploaded:</span>
                          <span>{formatDate(viewModal.image.upload_date)}</span>
                        </div>
                        {viewModal.image.subject_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subject:</span>
                            <span>{viewModal.image.subject_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {viewModal.image.description && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600 text-sm">{viewModal.image.description}</p>
                      </div>
                    )}

                    {viewModal.image.tags && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                        <p className="text-gray-600 text-sm">{viewModal.image.tags}</p>
                      </div>
                    )}

                    {viewModal.image.extracted_text && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Extracted Text</h3>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
                          {viewModal.image.extracted_text}
                        </div>
                      </div>
                    )}

                    {viewModal.image.ai_analysis && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">AI Analysis</h3>
                        <div className="bg-blue-50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
                          {viewModal.image.ai_analysis}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal.isOpen && editModal.image && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit Image</h3>
                <button
                  onClick={() => setEditModal({ isOpen: false, image: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe this image..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="math, homework, quiz (comma separated)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={editSubjectId}
                    onChange={(e) => setEditSubjectId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditModal({ isOpen: false, image: null })}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEdit(editModal.image!.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
