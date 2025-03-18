'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyPassword, decryptResumeData } from './queries'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import type { ResumeData } from '../../../(app)/dashboard/resume/types'
import ResumeViewer from './_components/resume-viewer'

export default function SharedResume() {
  const searchParams = useSearchParams()
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const encodedData = searchParams.get('data')
  const key = searchParams.get('key')
  const isPasswordProtected = !!key

  if (!encodedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Invalid share link
      </div>
    )
  }

  const handlePasswordSubmit = async () => {
    try {
      if (!key || !await verifyPassword(password, decodeURIComponent(key))) {
        setError('Invalid password')
        return
      }

      const encryptedData = decodeURIComponent(encodedData)
      const decodedResume = decryptResumeData(encryptedData)
      setResume(decodedResume)
    } catch (err) {
      setError('Invalid share link')
      console.log(err)
    }
  }

  // If not password protected, decode and show resume directly
  if (!isPasswordProtected && !resume) {
    try {
      const encryptedData = decodeURIComponent(encodedData)
      const decodedResume = decryptResumeData(encryptedData)
      return (
        <div className="container mx-auto py-8">
          <ResumeViewer resume={decodedResume} />
        </div>
      )
    } catch {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Invalid share link
        </div>
      )
    }
  }

  // Show password entry if protected and not yet verified
  if (isPasswordProtected && !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">Password Protected Resume</h1>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              className="w-full" 
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              View Resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show resume after password verification
  return (
    <div className="container mx-auto py-8">
      <ResumeViewer resume={resume!} />
      <div className="py-2 text-center text-4xl font-bold">Pulpit</div>
    </div>
  )
}