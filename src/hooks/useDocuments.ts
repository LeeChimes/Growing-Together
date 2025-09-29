import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { UserDocumentT, DocumentFormDataT, DocumentUploadDataT, validateDocumentUpload, getDocumentStatus } from '../types/documents';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Share } from 'react-native';

// Get user's documents
export const useMyDocuments = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['my-documents', user?.id],
    queryFn: async (): Promise<UserDocumentT[]> => {
      if (!user) return [];

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('user_documents')
          .select(`
            *,
            uploader:uploaded_by_user_id(full_name, email)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Cache the documents metadata
        await cacheOperations.upsertCache('user_documents_cache', data || []);
        
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('user_documents_cache');
        return cachedData.filter((doc: UserDocumentT) => doc.user_id === user.id);
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get documents for a specific user (admin only)
export const useUserDocuments = (userId?: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['user-documents', userId],
    queryFn: async (): Promise<UserDocumentT[]> => {
      if (!userId || !(await syncManager.isOnline())) return [];

      const { data, error } = await supabase
        .from('user_documents')
        .select(`
          *,
          uploader:uploaded_by_user_id(full_name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: user?.role === 'admin' && !!userId,
  });
};

// Get all users with their document counts (admin only)
export const useUsersWithDocuments = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['users-documents-summary'],
    queryFn: async () => {
      if (!(await syncManager.isOnline())) return [];

      // Get all users with document counts
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          plot_number,
          user_documents(id, type, expires_at)
        ` as any)
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Process the data to include document statistics
      return (data as any[] || []).map((profile: any) => {
        const documents: any[] = profile.user_documents || [];
        const contractDoc = documents.find((doc: any) => doc.type === 'contract');
        const idDoc = documents.find((doc: any) => doc.type === 'id');
        const otherDocs = documents.filter((doc: any) => doc.type === 'other');

        // Check expiry status
        const expiringDocs = documents.filter((doc: any) => 
          doc.expires_at && getDocumentStatus(doc.expires_at) === 'expiring'
        );
        const expiredDocs = documents.filter((doc: any) => 
          doc.expires_at && getDocumentStatus(doc.expires_at) === 'expired'
        );

        return {
          ...profile,
          documentStats: {
            total: documents.length,
            hasContract: !!contractDoc,
            hasId: !!idDoc,
            otherCount: otherDocs.length,
            expiringCount: expiringDocs.length,
            expiredCount: expiredDocs.length,
          },
        };
      });
    },
    enabled: user?.role === 'admin',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Upload document
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      documentData: DocumentFormDataT;
      file: DocumentUploadDataT;
      userId?: string; // For admin uploading on behalf of user
    }): Promise<UserDocumentT> => {
      if (!user) throw new Error('User not authenticated');

      // Validate file
      const validation = validateDocumentUpload(data.file);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const targetUserId = data.userId || user.id;

      if (!(await syncManager.isOnline())) {
        throw new Error('Document upload requires internet connection');
      }

      try {
        // Upload file to storage
        const fileName = `documents/${targetUserId}/${Date.now()}_${data.file.name}`;
        const fileUri = data.file.uri;

        // Read file as blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, blob, {
            contentType: data.file.type || 'application/octet-stream',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path);

        // Create document record
        const documentRecord = {
          id: crypto.randomUUID(),
          user_id: targetUserId,
          title: data.documentData.title,
          type: data.documentData.type,
          file_url: urlData.publicUrl,
          file_name: data.file.name,
          file_size: data.file.size,
          mime_type: data.file.type,
          uploaded_by_user_id: user.id,
          expires_at: data.documentData.expires_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: result, error } = await supabase
          .from('user_documents')
          .insert(documentRecord as any)
          .select()
          .single();

        if (error) throw error;
        return result;
      } catch (error) {
        console.error('Document upload failed:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      queryClient.invalidateQueries({ queryKey: ['user-documents', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users-documents-summary'] });
    },
  });
};

// Delete document
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!(await syncManager.isOnline())) {
        throw new Error('Document deletion requires internet connection');
      }

      // Get document info first
      const { data: document, error: fetchError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Check permissions (user can delete their own docs, admin can delete any)
      if (document.user_id !== user?.id && user?.role !== 'admin') {
        throw new Error('Permission denied');
      }

      // Delete from storage
      if (document.file_url) {
        const path = document.file_url.split('/').pop();
        if (path) {
          await supabase.storage
            .from('documents')
            .remove([`documents/${document.user_id}/${path}`]);
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['users-documents-summary'] });
    },
  });
};

// Document picker hook
export const useDocumentPicker = () => {
  return useMutation({
    mutationFn: async (): Promise<DocumentUploadDataT | null> => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return null;
        }

        const asset = result.assets[0];
        
        return {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        };
      } catch (error) {
        console.error('Document picker error:', error);
        throw new Error('Failed to pick document');
      }
    },
  });
};

// Download/view document
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (document: UserDocumentT) => {
      try {
        if (!(await syncManager.isOnline())) {
          throw new Error('Document download requires internet connection');
        }

        // For now, we'll use the Share API to let users handle the document
        // In a more advanced implementation, you might download and open with a viewer
        await Share.share({
          url: document.file_url,
          title: document.title,
        });
      } catch (error) {
        console.error('Document download failed:', error);
        throw new Error('Failed to open document');
      }
    },
  });
};

// Get documents requiring attention (expiring/expired)
export const useDocumentsRequiringAttention = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['documents-attention', user?.id],
    queryFn: async () => {
      if (!(await syncManager.isOnline())) return [];

      const query = user?.role === 'admin' 
        ? supabase.from('user_documents').select(`
            *,
            profiles:user_id(full_name, email, plot_number)
          `)
        : supabase.from('user_documents').select('*').eq('user_id', user?.id);

      const { data, error } = await query;
      if (error) throw error;

      const documents = data || [];
      
      // Filter documents that are expiring or expired
      return documents.filter(doc => {
        if (!doc.expires_at) return false;
        const status = getDocumentStatus(doc.expires_at);
        return status === 'expiring' || status === 'expired';
      }).map(doc => ({
        ...doc,
        status: getDocumentStatus(doc.expires_at),
      }));
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Update document
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserDocumentT> & { id: string }) => {
      if (!(await syncManager.isOnline())) {
        throw new Error('Document update requires internet connection');
      }

      const { data, error } = await supabase
        .from('user_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['users-documents-summary'] });
      queryClient.invalidateQueries({ queryKey: ['documents-attention'] });
    },
  });
};