import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import { Mail, Phone, Globe, Github, Linkedin } from 'lucide-react'
import type { ResumeData } from '../../../types'

interface ModernTemplateProps {
  resumeData: ResumeData
  isEditable?: boolean
}

export default function ModernTemplate({ resumeData, isEditable }: ModernTemplateProps) {
  const renderSocialLinks = () => {
    const links = []

    if (resumeData.personal_info.linkedin && resumeData.personal_info.linkedin !== '-') {
      links.push(
        <a key="linkedin" href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-blue-600">
          <Linkedin className="w-4 h-4" />
          LinkedIn
        </a>
      )
    }

    if (resumeData.personal_info.github && resumeData.personal_info.github !== '-') {
      links.push(
        <a key="github" href={resumeData.personal_info.github} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-blue-600">
          <Github className="w-4 h-4" />
          GitHub
        </a>
      )
    }

    if (resumeData.personal_info.website && resumeData.personal_info.website !== '-') {
      links.push(
        <a key="website" href={resumeData.personal_info.website} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-blue-600">
          <Globe className="w-4 h-4" />
          Portfolio
        </a>
      )
    }

    return links
  }

  //   const renderSocialLinks2 = () => {
  //     const links = []

  //     if (resumeData.personal_info.linkedin && resumeData.personal_info.linkedin !== '-') {
  //       links.push(
  //         <a key="linkedin" href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer"
  //           className="flex items-center gap-1 text-gray-700 hover:underline">
  //           <Linkedin className="h-4 w-4" />
  //           LinkedIn
  //         </a>
  //       )
  //     }

  //     if (resumeData.personal_info.github && resumeData.personal_info.github !== '-') {
  //       links.push(
  //         <a key="github" href={resumeData.personal_info.github} target="_blank" rel="noopener noreferrer"
  //           className="flex items-center gap-1 text-gray-700 hover:underline">
  //           <Github className="h-4 w-4" />
  //           GitHub
  //         </a>
  //       )
  //     }

  //     if (resumeData.personal_info.website && resumeData.personal_info.website !== '-') {
  //       links.push(
  //         <a key="website" href={resumeData.personal_info.website} target="_blank" rel="noopener noreferrer"
  //           className="flex items-center gap-1 text-purple-500 hover:underline">
  //           <Globe className="h-4 w-4" />
  //           Portfolio
  //         </a>
  //       )
  //     }

  //     return links.length > 0 ? (
  //       <div className="mt-2 flex gap-4">{links}</div>
  //     ) : null
  //   }

  return (
    <div className="max-w-[800px] mx-auto bg-white p-8 shadow-lg">
      {/* Left Sidebar */}
      <div className="grid grid-cols-[250px,1fr] gap-8">
        <div className="space-y-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden mb-6 mx-auto">
            <img
              src="/images/profile-placeholder.jpg"
              alt={resumeData.personal_info.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {resumeData.personal_info.email !== '-' && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>{resumeData.personal_info.email}</span>
              </div>
            )}
            {resumeData.personal_info.contact_no !== '-' && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{resumeData.personal_info.contact_no}</span>
              </div>
            )}
            <div className="space-y-2">
              {renderSocialLinks()}
            </div>
          </div>

          {/* Skills */}
          {resumeData.skills?.length > 0 && (<div>
            <h3 className="font-semibold mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills?.map((skill, index) => (
                <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>)}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{resumeData.personal_info.name}</h1>
          </div>

          {/* Work Experience */}
          {resumeData.work_experience?.filter(exp => exp.company_name !== '').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
              <div className="space-y-4">
                {resumeData.work_experience
                  .filter(exp => exp.company_name !== '')
                  .map((exp, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <h3 className="font-semibold">{exp.job_title}</h3>
                      <div className="text-sm text-gray-600">{exp.company_name}</div>
                      <div className="text-sm text-gray-500 mb-2">{exp.duration}</div>
                      {exp.key_responsbilities.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1">
                          {exp.key_responsbilities.map((resp, i) => (
                            <li key={i} className="text-sm text-gray-600">{resp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects?.length > 0 && (<div>
            <h2 className="text-xl font-semibold mb-4">Projects</h2>
            <div className="space-y-4">
              {resumeData.projects?.map((project, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  {project.skills_used && (
                    <div className="flex flex-wrap gap-2">
                      {project.skills_used.map((skill, i) => (
                        <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>)}

          {/* Education/Qualifications */}
          {resumeData.qualifications?.length > 0 &&
            (<div>
              <h2 className="text-xl font-semibold mb-4">Education</h2>
              <div className="space-y-4">
                {resumeData.qualifications?.map((qual, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <h3 className="font-semibold">{qual.title}</h3>
                    <p className="text-sm text-gray-600">{qual.description}</p>
                  </div>
                ))}
              </div>
            </div>)}
        </div>
      </div>
    </div>
  )
}