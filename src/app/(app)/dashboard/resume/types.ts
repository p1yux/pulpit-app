export interface PersonalInfo {
  name: string
  gender: string
  contact_no: string
  email: string
  github: string
  linkedin: string
  website: string
}

export interface Info {
  title: string
  description: string
}

export interface Skill {
  name: string
}

export interface WorkEXP {
  company_name: string
  job_title: string
  duration: string
  key_responsbilities: string[]
}

export interface Project {
  title: string
  skills_used: Skill[]
  description: string
}

export interface ResumeData {
  personal_info: PersonalInfo
  qualifications: Info[]
  skills: Skill[]
  work_experience: WorkEXP[]
  projects: Project[]
}
