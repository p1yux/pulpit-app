'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllResume } from '../queries'
import { match } from 'ts-pattern'
import { Skeleton } from '~/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'
dayjs.extend(relativeTime)

export function ResumeList() {
  const resumesQuery = useQuery({
    queryKey: ['all-resume'],
    queryFn: getAllResume,
  })

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {match(resumesQuery)
        .with({ status: 'pending' }, () =>
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          )),
        )
        .with({ status: 'error' }, () => (
          <div className="">Something went wrong while fetching resumes</div>
        ))
        .with({ status: 'success' }, ({ data }) =>
          data.map((resume) => (
            <Link key={resume.id} href={`/dashboard/resume/${resume.slug}`}>
              <Card className="max-w-sm">
                <CardHeader>
                  <CardTitle>{resume.title}</CardTitle>
                  <CardDescription>Uploaded {dayjs(resume.created_at).fromNow()}</CardDescription>
                </CardHeader>

                <CardContent>This is content</CardContent>
              </Card>
            </Link>
          )),
        )
        .exhaustive()}
    </div>
  )
}
