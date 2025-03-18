import ResumeEditor from './_components/resume-editor'

type ResumeDetailsProps = {
  params: Promise<{ resumeSlug: string }>
}

export default async function ResumeDetails({ params }: ResumeDetailsProps) {
  const { resumeSlug } = await params

  return <ResumeEditor slug={resumeSlug} />
}


// 'use client'

// import { useQuery } from '@tanstack/react-query'
// import { getResumeDetails } from './queries'
// import { match } from 'ts-pattern'
// import { Spinner } from '@react-pdf-viewer/core'
// import { ResumeEditor } from './_components/resume-editor'
// import { PasswordProtection } from './_components/password-protection'
// import { useState } from 'react'

// import '@react-pdf-viewer/core/lib/styles/index.css'

// export default function PublicResume({ params }: { params: { slug: string } }) {
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const resumeQuery = useQuery({
//     queryKey: ['public-resume', params.slug],
//     queryFn: () => getResumeDetails(params.slug),
//     enabled: isAuthenticated,
//   })

//   if (!isAuthenticated) {
//     return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} />
//   }

//   return match(resumeQuery)
//     .with({ status: 'pending' }, () => (
//       <div className="flex h-screen w-full items-center justify-center">
//         <Spinner />
//       </div>
//     ))
//     .with({ status: 'error' }, () => (
//       <div className="flex h-screen w-full items-center justify-center">
//         <p className="text-red-500">Failed to load resume. Please try again later.</p>
//       </div>
//     ))
//     .with({ status: 'success' }, ({ data }) => <ResumeEditor resume={data} />)
//     .otherwise(() => null)
// }