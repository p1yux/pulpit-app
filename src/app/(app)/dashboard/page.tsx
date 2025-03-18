import { ResumeList } from './_components/resume-list'
import ResumeUploader from './_components/resume-uploader'

export default function Dashboard() {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-end">
        <ResumeUploader />
      </div>

      <ResumeList />
    </div>
  )
}
