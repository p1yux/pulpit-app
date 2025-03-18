'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResumeDetails, updateResumeData, type Note } from '../queries'
import { match } from 'ts-pattern'
import { Loader2, Share2, Save, Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import type { ResumeData } from '../../types'
import BaseTemplate from './templates/base'
import { ShareDialog } from './shared-dialog'
import { toast } from 'sonner'

type ResumeEditorProps = {
  slug: string
}

export default function ResumeEditor({ slug }: ResumeEditorProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [editedResumeData, setEditedResumeData] = useState<ResumeData | null>(null)
  const queryClient = useQueryClient()

  const resumeQuery = useQuery({
    queryKey: ['resume', slug],
    queryFn: () => getResumeDetails(slug),
    staleTime: 0,
    refetchOnWindowFocus: true
  })

  const updateResumeMutation = useMutation({
    mutationFn: (data: ResumeData) => updateResumeData(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', slug] })
      toast.success('Resume updated successfully')
    },
    onError: (error) => {
      console.error('Error updating resume:', error)
      toast.error('Failed to update resume')
    }
  })

  const handleSaveChanges = () => {
    if (editedResumeData) {
      updateResumeMutation.mutate(editedResumeData)
    }
  }

  const handleDataChange = (newData: ResumeData) => {
    setEditedResumeData(newData)
  }

  const handleDownload = async () => {
    if (!resumeQuery.data?.resume_file) return;
    
    try {
      const response = await fetch(resumeQuery.data.resume_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeQuery.data.resume_file.split('/').pop() || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  return match(resumeQuery)
    .with({ status: 'pending' }, () => (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p>Processing resume data... This may take a few moments.</p>
        <p className="text-sm text-gray-500">We&apos;re extracting information from your resume.</p>
      </div>
    ))
    .with({ status: 'success' }, ({ data }) => {
      if (!data.resume_data) {
        return (
          <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p>Processing resume data... This may take a few moments.</p>
            <p className="text-sm text-gray-500">We&apos;re extracting information from your resume.</p>
          </div>
        )
      }

      let resumeData: ResumeData;
      try {
        resumeData = JSON.parse(data.resume_data)
        // Initialize edited data if not already set
        if (!editedResumeData) {
          setEditedResumeData(resumeData)
        }
      } catch (error) {
        console.error('Error parsing resume data:', error);
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <p className="text-red-500">Failed to parse resume data. Please try again later.</p>
          </div>
        )
      }

      // Use the edited data if available, otherwise use the original data
      const displayData = editedResumeData || resumeData

      return (
        <div className="relative min-h-screen">
          {/* Floating Action Buttons */}
          <div className="fixed top-6 right-4 z-50 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={handleSaveChanges}
              disabled={updateResumeMutation.isPending || !editedResumeData}
            >
              {updateResumeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white shadow-md hover:bg-gray-100"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Resume Template */}
          <BaseTemplate 
            resumeData={displayData} 
            onDataChange={handleDataChange} 
            isEditable={true} 
            slugId={slug}
            initialNotes={data.get_all_notes as Note[] || []}
            key={JSON.stringify(data.get_all_notes)}
          />

          {/* Share Dialog */}
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            resumeSlug={slug}
            resumeData={displayData}
          />
        </div>
      )
    })
    .otherwise(() => null)
}