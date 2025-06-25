'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id, Doc } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

type Document = Doc<'documents'> & {
  name: string;
  size: number;
  type: string;
  channelId: Id<'channels'>;
  storageId: Id<'_storage'>;
  uploadedAt: number;
  status: 'processing' | 'processed' | 'error';
  error?: string;
};

export function DocumentLibrary({ channelId }: { channelId: Id<'channels'> }) {
  const [isUploading, setIsUploading] = useState(false);
  const { isLoading, isAuthenticated } = useConvexAuth();
  
  // Get documents for the current channel
  const documents = useQuery(
    api.documents.list,
    isAuthenticated ? { channelId } : 'skip'
  ) || [];
  const deleteDocument = useMutation(api.documents.remove);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveStorageId = useMutation(api.documents.saveStorageId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Get a pre-authorized URL for the file upload
      const postUrl = await generateUploadUrl();
      
      // Upload the file to Convex storage
      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }
      
      // Get the storage ID from the response
      const { storageId } = await result.json();
      if (!storageId) {
        throw new Error('No storage ID returned from upload');
      }
      
      // Ensure channelId is properly typed
      const typedChannelId = channelId as Id<'channels'>;
      
      // Save the storage ID to the database
      await saveStorageId({
        name: file.name,
        type: file.type,
        size: file.size,
        storageId,
        channelId: typedChannelId,
      });
      
      toast.success('Document uploaded', {
        description: 'Your document is being processed.',
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'There was an error uploading your document.',
      });
    } finally {
      setIsUploading(false);
      // Reset the input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (documentId: Id<'documents'>) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocument({ documentId });
      toast.success('Document deleted', {
        description: 'The document has been removed.',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Deletion failed', {
        description: error instanceof Error ? error.message : 'There was an error deleting the document.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Document Library</h3>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="relative"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload
            <Input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.txt"
              disabled={isUploading}
              aria-label="Upload document"
            />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {!documents || documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No documents uploaded yet.</p>
            <p className="text-sm">Upload a document to get started.</p>
          </div>
        ) : (
          documents.map((doc: Document) => (
            <div
              key={doc._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    {doc.status === 'error' && doc.error && (
                      <span className="block text-red-500">Error: {doc.error}</span>
                    )}
                  </p>
                </div>
              </div>
              {doc.status === 'processing' ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(doc._id as Id<'documents'>)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
