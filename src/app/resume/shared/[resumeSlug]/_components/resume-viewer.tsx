'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Github, Globe, Linkedin, ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import type { ResumeData } from '../../../types'

interface ResumeViewerProps {
  resume: ResumeData
}

export default function ResumeViewer({ resume }: ResumeViewerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    skills: true,
    experience: true,
    projects: true,
    education: true,
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const SectionHeader = ({ title, section }: { title: string, section: string }) => (
    <CardHeader 
      className="flex flex-row items-center justify-between cursor-pointer" 
      onClick={() => toggleSection(section)}
    >
      <CardTitle>{title}</CardTitle>
      <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            openSections[section] && "transform rotate-180"
          )} 
        />
      </Button>
    </CardHeader>
  )

  const renderSocialLinks = () => {
    const links = []
    
    if (resume.personal_info.linkedin && resume.personal_info.linkedin !== '-') {
      links.push(
        <a key="linkedin" href={resume.personal_info.linkedin} target="_blank" rel="noopener noreferrer" 
           className="flex items-center gap-1 text-gray-700 hover:underline">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      )
    }
    
    if (resume.personal_info.github && resume.personal_info.github !== '-') {
      links.push(
        <a key="github" href={resume.personal_info.github} target="_blank" rel="noopener noreferrer" 
           className="flex items-center gap-1 text-gray-700 hover:underline">
          <Github className="h-4 w-4" />
          GitHub
        </a>
      )
    }
    
    if (resume.personal_info.website && resume.personal_info.website !== '-') {
      links.push(
        <a key="website" href={resume.personal_info.website} target="_blank" rel="noopener noreferrer" 
           className="flex items-center gap-1 text-purple-500 hover:underline">
          <Globe className="h-4 w-4" />
          Portfolio
        </a>
      )
    }

    return links.length > 0 ? (
      <div className="mt-2 flex gap-4">{links}</div>
    ) : null
  }

  // Parse resume data if it's a string
  let resumeData: ResumeData;
  try {
    resumeData = typeof resume === 'string' ? JSON.parse(resume) : resume;
  } catch (error) {
    console.log(error);
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-red-500">Failed to parse resume data. Please try again later.</p>
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Personal Info - Not Collapsible */}
      <Card className={cn("mb-8", !openSections.personal_info && "!gap-0")}>
        <CardHeader>
          <CardTitle>{resumeData.personal_info.name || 'Name not available'}</CardTitle>
          <div className="text-sm text-gray-500">
            <p>
              {resumeData.personal_info.email !== '-' && resumeData.personal_info.email}
              {resumeData.personal_info.contact_no !== '-' && resumeData.personal_info.contact_no && 
                ` • ${resumeData.personal_info.contact_no}`
              }
            </p>
            {resumeData.personal_info.gender !== '-' && (
              <p className="text-sm text-gray-500">Gender: {resumeData.personal_info.gender}</p>
            )}
            {renderSocialLinks()}
          </div>
        </CardHeader>
      </Card>

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && resumeData.skills.some(skill => skill.name !== '-') && (
        <Card className={cn("mb-8", !openSections.skills && "!gap-0")}>
          <SectionHeader title="Skills" section="skills" />
          <div className={cn(
            "grid transition-all duration-200",
            openSections.skills ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.filter(skill => skill.name !== '-').map((skill, index) => (
                    <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Work Experience */}
      {resumeData.work_experience && resumeData.work_experience.length > 0 && resumeData.work_experience.some(exp => exp.company_name !== '-') && (
        <Card className={cn("mb-8", !openSections.experience && "!gap-0")}>
          <SectionHeader title="Work Experience" section="experience" />
          <div className={cn(
            "grid transition-all duration-200",
            openSections.experience ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.work_experience
                  .filter(exp => exp.company_name !== '-')
                  .map((exp, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-semibold">{exp.company_name}</h3>
                      <p className="text-sm text-gray-500">{exp.job_title} • {exp.duration}</p>
                      {exp.key_responsbilities.length > 0 && (
                        <ul className="mt-2 list-disc pl-5">
                          {exp.key_responsbilities
                            .filter(resp => resp !== '-')
                            .map((resp, i) => (
                              <li key={i} className="text-sm">{resp}</li>
                            ))}
                        </ul>
                      )}
                      {index < resumeData.work_experience.filter(exp => exp.company_name !== '-').length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.length > 0 && resumeData.projects.some(project => project.title !== '-') && (
        <Card className={cn("mb-8", !openSections.projects && "!gap-0")}>
          <SectionHeader title="Projects" section="projects" />
          <div className={cn(
            "grid transition-all duration-200",
            openSections.projects ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.projects
                  .filter(project => project.title !== '-')
                  .map((project, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="mt-2 text-sm">{project.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.skills_used
                          .filter(skill => skill.name !== '-')
                          .map((skill, idx) => (
                            <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                              {skill.name}
                            </span>
                          ))}
                      </div>
                      {index < resumeData.projects.filter(project => project.title !== '-').length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Education */}
      {resumeData.qualifications && resumeData.qualifications.length > 0 && resumeData.qualifications.some(qual => qual.title !== '-') && (
        <Card className={cn("mb-8", !openSections.education && "!gap-0")}>
          <SectionHeader title="Education" section="education" />
          <div className={cn(
            "grid transition-all duration-200",
            openSections.education ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.qualifications
                  .filter(qual => qual.title !== '-')
                  .map((qual, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-semibold">{qual.title}</h3>
                      <p className="text-sm text-gray-600">{qual.description}</p>
                      {index < resumeData.qualifications.filter(qual => qual.title !== '-').length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
