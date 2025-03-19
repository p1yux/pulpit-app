import { apiClient } from '~/lib/client'
import { Resume } from '../../utils'
import type { ResumeData } from '../types'
import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'
import { env } from '~/lib/env'

const ENCRYPTION_KEY = env.NEXT_PUBLIC_ENCRYPTION_KEY

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export function encryptResumeData(data: ResumeData): string {
  const jsonStr = JSON.stringify(data)
  return CryptoJS.AES.encrypt(jsonStr, ENCRYPTION_KEY).toString()
}

export async function getResumeDetails(resumeSlug: string): Promise<Resume> {
  const { data } = await apiClient.get<Resume>(`/channels/resume/${resumeSlug}/`)
  if (!data) {
    throw new Error('Resume not found')
  }
  return data
}

export async function updateResumeData(resumeSlug: string, resumeData: ResumeData): Promise<Resume> {
  const { data } = await apiClient.patch<Resume>(`/channels/resume/${resumeSlug}/`, {
    resume_data: JSON.stringify(resumeData)
  })
  return data
}

interface NoteContext {
  beforeText: string;
  afterText: string;
  parentElement: string;
}

export interface CreateNoteRequest {
  identifier: string;
  note: string;
  section: string;
  selected_text: string;
  context?: NoteContext;
  note_file?: File;
}

export type Note = {
  id: string;
  identifier: string;
  note: string;
  note_file?: string;
  note_file_type?: string;
  section: string;
  selected_text: string;
  context?: NoteContext;
}

export const createNote = async (slugId: string, noteData: CreateNoteRequest | FormData): Promise<Note> => {
  try {
    if (!(noteData instanceof FormData) && noteData.note_file) {
      const formData = new FormData();
      Object.entries(noteData).forEach(([key, value]) => {
        if (key === 'note_file') {
          formData.append('note_file', value as File);
        } else if (key === 'context' && value) {
          formData.append('context', JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      noteData = formData;
    }

    const { data } = await apiClient.post<Note>(
      `/channels/resume/${slugId}/create-notes/`,
      noteData,
      noteData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : undefined
    );
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const getAllNotes = async (slugId: string): Promise<Note[]> => {
  try {
    const { data } = await apiClient.get<{ get_all_notes: Note[] }>(
      `/channels/resume/${slugId}/`
    );
    return data.get_all_notes;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const updateNote = async (noteId: string, noteData: { note: string; note_file?: File }): Promise<Note> => {
  try {
    let formData: FormData | null = null;
    
    if (noteData.note_file) {
      formData = new FormData();
      formData.append('note', noteData.note);
      formData.append('note_file', noteData.note_file);
      
      const { data } = await apiClient.patch<Note>(
        `/channels/notes/${noteId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return data;
    } else {
      // Simple JSON request if no file is included
      const { data } = await apiClient.patch<Note>(
        `/channels/notes/${noteId}/`,
        { note: noteData.note }
      );
      return data;
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/channels/notes/${id}/`);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};