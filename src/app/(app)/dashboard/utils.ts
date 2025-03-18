import { z } from 'zod'

export type Resume = {
  id: number
  created_at: string
  resume_file: string
  slug: string
  title: string
  resume_data: string
  user: number
  get_all_notes: Array<{
    identifier: string
    note: string
    note_image: string | null
  }>
}

export const uploadResumeSchema = z.object({
  title: z.string().min(1, 'Please enter resume title'),
  resume_file: z.instanceof(File, { message: 'Please upload your resume.' }),
})
export type UploadResumeSchema = z.infer<typeof uploadResumeSchema>
