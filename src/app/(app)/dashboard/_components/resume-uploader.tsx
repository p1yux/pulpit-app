'use client'

import { UploadIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { uploadResumeSchema, UploadResumeSchema } from '../utils'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import Dropzone from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadResume } from '../queries'
import { useState } from 'react'
import { handleError } from '~/lib/error'
import { toast } from 'sonner'

export default function ResumeUploader() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const form = useForm<UploadResumeSchema>({
    resolver: zodResolver(uploadResumeSchema),
    defaultValues: {
      title: '',
    },
  })

  const uploadResumeMutation = useMutation({
    mutationFn: uploadResume,
    onError: handleError,
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['all-resume'],
      })
      form.reset()
      setOpen(false)
      toast.success('Resume uploaded successfully.')
    },
  })

  const resume = form.watch('resume_file')

  function handleResumeUpload(values: UploadResumeSchema) {
    uploadResumeMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UploadIcon className="size-4" />
          <span>Upload Pdf</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogDescription>Upload your new resume on pulpit</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleResumeUpload)} className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title for you resume" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume_file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your resume</FormLabel>
                  <FormControl>
                    <Dropzone
                      maxFiles={1}
                      accept={{
                        'application/pdf': ['.pdf'],
                      }}
                      onDrop={(acceptedFiles) => {
                        field.onChange(acceptedFiles[0])
                      }}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <section>
                          <div
                            {...getRootProps({
                              className:
                                'w-full h-40 rounded-md border border-dashed flex items-center justify-center text-muted-foreground',
                            })}
                          >
                            <input {...getInputProps()} />
                            <p>Upload resume (.pdf)</p>
                          </div>
                        </section>
                      )}
                    </Dropzone>
                  </FormControl>
                  {resume ? <FormDescription>{resume.name}</FormDescription> : null}

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={uploadResumeMutation.isPending}>Upload</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
