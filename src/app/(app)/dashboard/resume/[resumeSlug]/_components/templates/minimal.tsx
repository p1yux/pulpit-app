'use client'

import { Mail, Phone, MapPin, Globe, Github, Linkedin } from 'lucide-react'
import type { ResumeData } from '../../../types'

interface MinimalTemplateProps {
  resumeData: ResumeData
  isEditable?: boolean
}

export default function MinimalTemplate({ resumeData, isEditable }: MinimalTemplateProps) {
  const { personal_info, skills, work_experience, qualifications, projects } = resumeData
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100 text-gray-900">
      {/* Left Sidebar */}
      <aside className="w-full md:w-[280px] bg-[#1E2A3B] text-white p-6 md:p-8 flex flex-col items-center md:items-start">
        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full overflow-hidden mb-6">
          <img
            src="/images/profile-placeholder.jpg"
            alt={personal_info.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contact Section */}
        <div className="w-full mb-6">
          <h2 className="uppercase text-sm mb-4 text-center md:text-left">Contact</h2>
          <div className="space-y-2 text-sm">
            {personal_info.email && personal_info.email !== '-' && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{personal_info.email}</span>
              </div>
            )}
            {personal_info.contact_no && personal_info.contact_no !== '-' && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{personal_info.contact_no}</span>
              </div>
            )}
            {personal_info.github && personal_info.github !== '-' && (
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <a href={personal_info.github} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  GitHub
                </a>
              </div>
            )}
            {personal_info.linkedin && personal_info.linkedin !== '-' && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <a href={personal_info.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  LinkedIn
                </a>
              </div>
            )}
            {personal_info.website && personal_info.website !== '-' && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <a href={personal_info.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Portfolio
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="w-full mb-6">
          <h3 className="uppercase text-sm mb-2 text-center md:text-left">Skills</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {skills?.map((skill, index) => (
              <span key={index} className="bg-gray-700 text-white px-2 py-1 rounded text-sm truncate">
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="w-full">
          <h2 className="uppercase text-sm mb-4 text-center md:text-left">Education</h2>
          <div className="space-y-4 text-sm">
            {qualifications?.map((edu, index) => (
              <div key={index}>
                <div className="font-medium">{edu.title}</div>
                <div className="text-gray-400">{edu.description}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold">{personal_info.name || 'Name not available'}</h1>
          {personal_info.website && personal_info.website !== '-' && (
            <a href={personal_info.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 uppercase font-medium hover:text-blue-700">
              Portfolio
            </a>
          )}
        </div>

        {/* Experience */}
        {work_experience && work_experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Experience</h2>
            <div className="space-y-6">
              {work_experience.map((exp, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{exp.job_title}</h3>
                  <div className="text-gray-700">{exp.company_name}</div>
                  {exp.duration && exp.duration !== '-' && (
                    <div className="text-gray-500 text-sm">{exp.duration}</div>
                  )}
                  {exp.key_responsbilities && exp.key_responsbilities.length > 0 && (
                    <ul className="list-disc ml-4 mt-2 text-gray-600 text-sm">
                      {exp.key_responsbilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Projects</h2>
            <div className="space-y-6">
              {projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-semibold">{project.title}</h3>
                  {project.description && project.description !== '-' && (
                    <p className="text-gray-600 text-sm">{project.description}</p>
                  )}
                  {project.skills_used && project.skills_used.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.skills_used.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}