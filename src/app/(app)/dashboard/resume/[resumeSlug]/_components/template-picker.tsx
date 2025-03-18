'use client'

import { templates } from './templates/types'
import { cn } from '~/lib/utils'
import Image from 'next/image'

interface TemplatePickerProps {
  currentTemplate: string
  onSelect: (templateId: string) => void
}

export function TemplatePicker({
  currentTemplate,
  onSelect
}: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.values(templates).map((template) => (
        <div
          key={template.id}
          className={cn(
            "flex flex-col gap-2 cursor-pointer transition-all",
            "p-2 rounded-lg border",
            currentTemplate === template.id
              ? "bg-gray-100 ring-2 ring-primary"
              : "hover:bg-gray-50"
          )}
          onClick={() => onSelect(template.id)}
        >
          <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden bg-white">
            <Image
              src={template.thumbnail}
              alt={template.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">{template.name}</h3>
            <p className="text-sm text-gray-500">{template.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}