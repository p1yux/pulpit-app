'use client'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Github, Globe, Linkedin, ChevronDown, Edit, Check, X, Download, FileIcon, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react'
import { useState, useEffect, memo, useRef, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { ResumeData } from '../../../types'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { produce } from 'immer'
import { 
  createNote as createNoteAPI, 
  getAllNotes, 
  updateNote as updateNoteAPI, 
  deleteNote as deleteNoteAPI,
  type Note as APINote,
  type CreateNoteRequest 
} from '../../queries'
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { createPortal } from 'react-dom';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type BaseTemplateProps = {
  resumeData: ResumeData
  isEditable?: boolean
  onDataChange?: (newData: ResumeData) => void
  slugId: string
  initialNotes?: APINote[]
}

const findNotesForItem = (notes: Record<string, APINote>, section: string, text: string, field?: string) => {
  // Define section name constants to avoid mismatches
  const SECTIONS = {
    PERSONAL_INFO: 'personal_info',
    SKILLS: 'skills',
    WORK_EXPERIENCE: 'work_experience',
    PROJECTS: 'projects',
    QUALIFICATIONS: 'qualifications'
  }

  console.log('Finding notes for:', { section, text, field, notes });
  
  if (section === SECTIONS.QUALIFICATIONS) {
    console.log('Qualification note search:', {
      section,
      text,
      field,
      availableNotes: Object.values(notes).filter(n => n.section === SECTIONS.QUALIFICATIONS)
    });
  }
  
  return Object.values(notes).filter(note => {
    // First check basic criteria
    if (note.section !== section) {
      console.log('Section mismatch:', { noteSection: note.section, section });
      return false;
    }

    if (!text.includes(note.selected_text)) {
      console.log('Text not found:', { text, selectedText: note.selected_text });
      return false;
    }
    
    // If we have a field, check if it matches the parentElement in context
    if (field && note.context?.parentElement) {
      console.log('Checking field match:', { 
        field, 
        parentElement: note.context.parentElement,
        section,
        text: note.selected_text 
      });
      
      // For work experience responsibilities, we need to match the number
      if (field.startsWith('responsibility_') && note.context.parentElement.startsWith('responsibility_')) {
        const fieldNum = parseInt(field.split('_')[1]);
        const noteNum = parseInt(note.context.parentElement.split('_')[1]);
        if (fieldNum !== noteNum) {
          console.log('Responsibility number mismatch:', { field, parentElement: note.context.parentElement });
          return false;
        }
      } 
      // For all other fields, do exact match
      else if (note.context.parentElement !== field) {
        console.log('Field mismatch:', { field, parentElement: note.context.parentElement });
        return false;
      }
    }
    
    // If we have context, verify the surrounding text matches
    if (note.context) {
      const index = text.indexOf(note.selected_text);
      if (index === -1) {
        console.log('Selected text not found in context');
        return false;
      }
      
      // Get the full text before and after, then trim
      const beforeText = text.substring(0, index).trim();
      const afterText = text.substring(index + note.selected_text.length).trim();
      
      console.log('Context comparison:', {
        beforeText,
        afterText,
        expectedBefore: note.context.beforeText,
        expectedAfter: note.context.afterText,
        matches: {
          before: !note.context.beforeText || beforeText.endsWith(note.context.beforeText.trim()),
          after: !note.context.afterText || afterText.startsWith(note.context.afterText.trim())
        }
      });

      // Check if the context matches - before text should end with expected before text
      // and after text should start with expected after text
      const beforeMatches = !note.context.beforeText || beforeText.endsWith(note.context.beforeText.trim());
      const afterMatches = !note.context.afterText || afterText.startsWith(note.context.afterText.trim());

      if (!beforeMatches || !afterMatches) {
        console.log('Context mismatch:', {
          beforeText,
          afterText,
          expectedBefore: note.context.beforeText,
          expectedAfter: note.context.afterText,
          text,
          selectedText: note.selected_text
        });
        return false;
      }
    }
    
    console.log('Note matched:', { section, field, text: note.selected_text });
    return true;
  });
};

const MIN_NOTE_LENGTH = 2;
const MIN_SELECTION_LENGTH = 2;
const PADDING = 20;

export default function BaseTemplate({ 
  resumeData, 
  isEditable = false, 
  onDataChange, 
  slugId,
  initialNotes = []
}: BaseTemplateProps) {
  // Define section name constants to avoid mismatches
  const SECTIONS = {
    PERSONAL_INFO: 'personal_info',
    SKILLS: 'skills',
    WORK_EXPERIENCE: 'work_experience',
    PROJECTS: 'projects',
    QUALIFICATIONS: 'qualifications'
  }

  // UI section names (for display and openSections state)
  const UI_SECTIONS = {
    SKILLS: 'skills',
    EXPERIENCE: 'experience',
    PROJECTS: 'projects',
    EDUCATION: 'education'
  }

  // Map UI section names to internal section names
  const SECTION_MAP: Record<string, string> = {
    'Work Experience': SECTIONS.WORK_EXPERIENCE,
    'Education': SECTIONS.QUALIFICATIONS,
    'Skills': SECTIONS.SKILLS,
    'Projects': SECTIONS.PROJECTS
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [UI_SECTIONS.SKILLS]: true,
    [UI_SECTIONS.EXPERIENCE]: true,
    [UI_SECTIONS.PROJECTS]: true,
    [UI_SECTIONS.EDUCATION]: true,
  })
  
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    [SECTIONS.PERSONAL_INFO]: false,
    [SECTIONS.SKILLS]: false,
    [SECTIONS.WORK_EXPERIENCE]: false,
    [SECTIONS.PROJECTS]: false,
    [SECTIONS.QUALIFICATIONS]: false,
  })
  
  const [editingItem, setEditingItem] = useState<{
    section: string;
    index: number;
    field?: string;
  } | null>(null)

  const [notes, setNotes] = useState<Record<string, APINote>>(() => {
    return initialNotes.reduce((acc, note) => ({
      ...acc,
      [note.identifier]: note
    }), {})
  })
  const [selectedText, setSelectedText] = useState<{
    text: string;
    range: Range;
    position: { top: number; left: number };
    section: string;
    context: {
      beforeText?: string;
      afterText?: string;
      parentElement?: string;
    } | null;
  } | null>(null)
  const [showNotePopover, setShowNotePopover] = useState(false)

  // Add new state for note creation
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const lastSelectionRef = useRef<{
    text: string;
    range: Range;
    section: string;
  } | null>(null);

  const [editingNote, setEditingNote] = useState<APINote | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const toggleEditMode = (section: string) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const startEditing = (section: string, index: number, field?: string) => {
    setEditingItem({ section, index, field })
  }
  
  const cancelEditing = () => {
    setEditingItem(null)
  }
  
  const updateResumeData = (updater: (draft: ResumeData) => void) => {
    const newData = produce(resumeData, updater)
    if (onDataChange) {
      onDataChange(newData)
    }
    setEditingItem(null)
  }

  const SectionHeader = ({ title, section }: { title: string, section: string }) => {
    // Use the mapped section name for edit mode
    const internalSection = SECTION_MAP[title] || section
    
    // Map UI section names for toggling sections
    const uiSectionMap: Record<string, string> = {
      'Work Experience': UI_SECTIONS.EXPERIENCE,
      'Education': UI_SECTIONS.EDUCATION,
      'Skills': UI_SECTIONS.SKILLS,
      'Projects': UI_SECTIONS.PROJECTS
    }
    
    const uiSection = uiSectionMap[title] || section
    
    return (
      <CardHeader
        className="flex flex-row items-center justify-between"
      >
        <div className="flex items-center">
          <CardTitle>{title}</CardTitle>
          {isEditable && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                toggleEditMode(internalSection)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 hover:bg-transparent"
          onClick={() => toggleSection(uiSection)}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              openSections[uiSection] && "transform rotate-180"
            )}
          />
        </Button>
      </CardHeader>
    )
  }

  const renderSocialLinks = () => {
    const links = []

    if (resumeData.personal_info.linkedin && resumeData.personal_info.linkedin !== '-') {
      links.push(
        <a key="linkedin" href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-700 hover:underline">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      )
    }

    if (resumeData.personal_info.github && resumeData.personal_info.github !== '-') {
      links.push(
        <a key="github" href={resumeData.personal_info.github} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-700 hover:underline">
          <Github className="h-4 w-4" />
          GitHub
        </a>
      )
    }

    if (resumeData.personal_info.website && resumeData.personal_info.website !== '-') {
      links.push(
        <a key="website" href={resumeData.personal_info.website} target="_blank" rel="noopener noreferrer"
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
  
  const HighlightedText = memo(({ text, note, identifier }: { text: string; note: APINote; identifier: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLSpanElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: 0 });
    
    // Check file type based on both MIME type and file extension
    const getFileType = useCallback(() => {
      if (!note.note_file) return { isImage: false, isPDF: false };
      
      // Check MIME type first
      const isImageMime = note.note_file_type?.startsWith('image/') || false;
      const isPDFMime = note.note_file_type === 'application/pdf';
      
      // If MIME type is set, use that
      if (isImageMime || isPDFMime) {
        return { isImage: isImageMime, isPDF: isPDFMime };
      }
      
      // Fallback to extension check
      const fileName = note.note_file.split('/').pop() || '';
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
      const pdfExtensions = ['pdf'];
      
      const isImageExt = imageExtensions.includes(extension || '');
      const isPDFExt = pdfExtensions.includes(extension || '');
      
      return { isImage: isImageExt, isPDF: isPDFExt };
    }, [note.note_file, note.note_file_type]);
    
    const { isImage, isPDF } = getFileType();
    
    // Debug logging for file type detection
    useEffect(() => {
      if (note.note_file) {
        console.log('Note file details:', { 
          file: note.note_file, 
          type: note.note_file_type,
          isImage,
          isPDF,
          hasPreviewButton: isImage || isPDF
        });
      }
    }, [note.note_file, note.note_file_type, isImage, isPDF]);

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      clearHideTimeout();
      setShowTooltip(false);
      
      setEditingNote(note);
      setIsCreatingNote(true);
      setShowNotePopover(true);
    };

    const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (!note.note_file) return;
      
      try {
        const response = await fetch(note.note_file);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = note.note_file.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    };

    const handleDelete = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      clearHideTimeout();
      setShowTooltip(false);
      
      try {
        await deleteNoteAPI(slugId, note.id);
        // Remove note from state
        setNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[note.id];
          return newNotes;
        });
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    };

    const clearHideTimeout = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const updateTooltipPosition = () => {
      if (!highlightRef.current) return;
      
      const rect = highlightRef.current.getBoundingClientRect();
      setTooltipPosition({
        left: rect.left + (rect.width / 2),
        top: rect.top,
        width: rect.width
      });
    };

    const handleShowTooltip = () => {
      if (editingNote?.identifier === note.identifier || showNotePopover) return;
      clearHideTimeout();
      setShowTooltip(true);
      updateTooltipPosition();
    };

    const handleHideTooltip = () => {
      if (editingNote?.identifier === note.identifier || showNotePopover) return;
      timeoutRef.current = setTimeout(() => {
        if (!editingNote && !showNotePopover) {
          setShowTooltip(false);
        }
      }, 300);
    };

    useEffect(() => {
      if (editingNote?.identifier === note.identifier || showNotePopover) {
        setShowTooltip(false);
      }
    }, [editingNote, note.identifier, showNotePopover]);

    useEffect(() => {
      return () => {
        clearHideTimeout();
      };
    }, []);

    // Update position on scroll and resize
    useEffect(() => {
      if (showTooltip) {
        const handleUpdate = () => {
          updateTooltipPosition();
        };
        
        window.addEventListener('scroll', handleUpdate);
        window.addEventListener('resize', handleUpdate);
        
        // Initial position update
        handleUpdate();
        
        return () => {
          window.removeEventListener('scroll', handleUpdate);
          window.removeEventListener('resize', handleUpdate);
        };
      }
    }, [showTooltip]);

    useEffect(() => {
      // Debug log to check if preview state changes
      console.log('Preview state changed:', { isPreviewOpen, noteFile: note.note_file });
    }, [isPreviewOpen, note.note_file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
    };

    const handlePrevPage = () => {
      setPageNumber(page => Math.max(1, page - 1));
    };

    const handleNextPage = () => {
      setPageNumber(page => Math.min(numPages || page, page + 1));
    };

    const renderTooltip = () => {
      if (!showTooltip || editingNote || showNotePopover) return null;
      
      return createPortal(
        <div 
          ref={tooltipRef}
          className="fixed bg-white p-2 rounded shadow-lg border w-[320px] break-words"
          style={{
            zIndex: 2147483647,
            top: `${tooltipPosition.top - 8}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'auto'
          }}
          onMouseEnter={handleShowTooltip}
          onMouseLeave={handleHideTooltip}
        >
          {/* Add a tooltip arrow */}
          <div 
            className="absolute w-3 h-3 bg-white transform rotate-45"
            style={{
              bottom: '-6px',
              left: '50%',
              marginLeft: '-6px',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0'
            }}
          />
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm flex-1">{note.note}</p>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 relative group"
                  onClick={handleDelete}
                >
                  <X className="h-3 w-3 text-red-600" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Delete
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100 relative group"
                  onClick={handleEdit}
                >
                  <Edit className="h-3 w-3 text-blue-600" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Edit
                  </span>
                </Button>
              </div>
            </div>
            
            {note.note_file && (
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {isImage ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : isPDF ? (
                      <FileIcon className="h-4 w-4" />
                    ) : null}
                    <span className="truncate max-w-[200px]">
                      {note.note_file.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(isImage) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-blue-100 relative group"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('Preview button clicked for:', { isImage, isPDF, file: note.note_file });
                          setIsPreviewOpen(true);
                          // Force close the tooltip to avoid interference
                          setShowTooltip(false);
                        }}
                      >
                        <Maximize2 className="h-3 w-3 text-blue-600" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Preview
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100 relative group"
                      onClick={handleDownload}
                    >
                      <Download className="h-3 w-3" />
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Download
                      </span>
                    </Button>
                  </div>
                </div>
                {isImage && (
                  <div className="mt-2 max-h-[200px] overflow-hidden">
                    <img 
                      src={note.note_file} 
                      alt="Note attachment" 
                      className="max-w-full h-auto rounded object-contain"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      );
    };

    return (
      <span 
        ref={highlightRef}
        className="note-highlight bg-yellow-200 relative group cursor-pointer" 
        data-note-id={identifier}
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleHideTooltip}
      >
        {text}
        {renderTooltip()}
        {isPreviewOpen && note.note_file && createPortal(
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ 
              zIndex: 2147483646,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => {
              console.log('Preview backdrop clicked');
              if (e.target === e.currentTarget) {
                setIsPreviewOpen(false);
                setIsFullscreen(false);
              }
            }}
          >
            <div 
              className={cn(
                "bg-white rounded-lg p-4 relative",
                isFullscreen ? "w-[95vw] h-[95vh]" : "max-w-[90vw] max-h-[90vh]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsFullscreen(prev => !prev)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    console.log('Close preview button clicked');
                    setIsPreviewOpen(false);
                    setIsFullscreen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {isImage ? (
                <img 
                  src={note.note_file} 
                  alt="Note attachment" 
                  className={cn(
                    "object-contain rounded-lg",
                    isFullscreen ? "w-full h-full" : "max-w-full max-h-[calc(90vh-2rem)]"
                  )}
                />
              ) : isPDF && (
                <div className="flex flex-col items-center gap-4">
                  <Document
                    file={note.note_file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="max-w-full"
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      className="max-w-full shadow-lg rounded"
                      width={isFullscreen ? window.innerWidth * 0.8 : Math.min(window.innerWidth * 0.8, 800)}
                    />
                  </Document>
                  {numPages && numPages > 1 && (
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={pageNumber <= 1}
                      >
                        Previous
                      </Button>
                      <p className="text-sm">
                        Page {pageNumber} of {numPages}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={pageNumber >= (numPages || 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </span>
    );
  });

  HighlightedText.displayName = 'HighlightedText';

  const EditableText = ({ 
    value, 
    section, 
    index, 
    field, 
    isMultiline = false 
  }: { 
    value: string; 
    section: string; 
    index: number; 
    field: string; 
    isMultiline?: boolean;
  }) => {
    const [inputValue, setInputValue] = useState(value)
    const isEditing = editingItem?.section === section && 
                      editingItem?.index === index && 
                      editingItem?.field === field

    // Find notes for this text with field context
    const textNotes = findNotesForItem(notes, section, value, field);

    if (!isEditable || !editMode[section]) {
      if (textNotes.length > 0) {
        let lastIndex = 0;
        const parts: React.ReactNode[] = [];
        
        // Sort notes by their position in the text
        const sortedNotes = textNotes.sort((a, b) => {
          const aIndex = findExactTextPosition(value, a.selected_text, a.context);
          const bIndex = findExactTextPosition(value, b.selected_text, b.context);
          return aIndex - bIndex;
        });
        
        sortedNotes.forEach((note) => {
          const exactIndex = findExactTextPosition(value, note.selected_text, note.context);
          if (exactIndex >= lastIndex) {
            if (exactIndex > lastIndex) {
              parts.push(value.substring(lastIndex, exactIndex));
            }
            parts.push(
              <HighlightedText 
                key={note.identifier} 
                text={note.selected_text}
                note={note}
                identifier={note.identifier}
              />
            );
            lastIndex = exactIndex + note.selected_text.length;
          }
        });
        
        if (lastIndex < value.length) {
          parts.push(value.substring(lastIndex));
        }

        return (
          <div 
            data-section={section}
            data-field={field}
            className="relative inline-block"
          >
            {parts}
          </div>
        );
      }

      return (
        <div 
          data-section={section}
          data-field={field}
          className="relative inline-block"
        >
          {value}
        </div>
      );
    }
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {isMultiline ? (
            <Textarea 
              value={inputValue} 
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
              className="min-h-[100px]"
            />
          ) : (
            <Input 
              value={inputValue} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            />
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => updateResumeData(draft => {
              if (section === SECTIONS.PERSONAL_INFO) {
                (draft.personal_info as unknown as Record<string, string>)[field] = inputValue;
              } else if (section === SECTIONS.SKILLS) {
                draft.skills[index].name = inputValue;
              } else if (section === SECTIONS.WORK_EXPERIENCE) {
                (draft.work_experience[index] as unknown as Record<string, string>)[field] = inputValue;
              } else if (section === SECTIONS.PROJECTS) {
                (draft.projects[index] as unknown as Record<string, string>)[field] = inputValue;
              } else if (section === SECTIONS.QUALIFICATIONS) {
                (draft.qualifications[index] as unknown as Record<string, string>)[field] = inputValue;
              }
            })}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cancelEditing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    
    return (
      <div 
        className="cursor-pointer hover:bg-gray-100 px-1 rounded inline-block"
        onClick={() => startEditing(section, index, field)}
        data-section={section}
        data-field={field}
      >
        {value}
      </div>
    )
  }
  
  const EditableResponsibility = ({ 
    value, 
    section, 
    itemIndex, 
    respIndex 
  }: { 
    value: string; 
    section: string; 
    itemIndex: number; 
    respIndex: number;
  }) => {
    const [inputValue, setInputValue] = useState(value)
    const isEditing = editingItem?.section === section && 
                      editingItem?.index === itemIndex && 
                      editingItem?.field === `resp_${respIndex}`
    
    // Convert to 1-based indexing for finding notes
    const oneBasedIndex = respIndex + 1;
    // Find notes for this responsibility with field context
    const respNotes = findNotesForItem(notes, section, value, `responsibility_${oneBasedIndex}`);

    if (!isEditable || !editMode[section]) {
      if (respNotes.length > 0) {
        let lastIndex = 0;
        const parts: React.ReactNode[] = [];
        
        // Sort notes by their position in the text
        const sortedNotes = respNotes.sort((a, b) => {
          const aIndex = findExactTextPosition(value, a.selected_text, a.context);
          const bIndex = findExactTextPosition(value, b.selected_text, b.context);
          return aIndex - bIndex;
        });
        
        sortedNotes.forEach((note) => {
          const exactIndex = findExactTextPosition(value, note.selected_text, note.context);
          if (exactIndex >= lastIndex) {
            if (exactIndex > lastIndex) {
              parts.push(value.substring(lastIndex, exactIndex));
            }
            parts.push(
              <HighlightedText 
                key={note.identifier} 
                text={note.selected_text}
                note={note}
                identifier={note.identifier}
              />
            );
            lastIndex = exactIndex + note.selected_text.length;
          }
        });
        
        if (lastIndex < value.length) {
          parts.push(value.substring(lastIndex));
        }

        return (
          <span
            data-section={section}
            data-field={`responsibility_${oneBasedIndex}`}
            className="relative"
          >
            {parts}
          </span>
        );
      }

      return (
        <span
          data-section={section}
          data-field={`responsibility_${oneBasedIndex}`}
          className="relative"
        >
          {value}
        </span>
      );
    }
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Textarea 
            value={inputValue} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex flex-col gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => updateResumeData(draft => {
                draft.work_experience[itemIndex].key_responsbilities[respIndex] = inputValue
              })}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={cancelEditing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <span 
        className="cursor-pointer hover:bg-gray-100 px-1 rounded"
        onClick={() => startEditing(section, itemIndex, `resp_${respIndex}`)}
      >
        {value}
      </span>
    )
  }

  // Add helper function to find exact text position using context
  const findExactTextPosition = (fullText: string, selectedText: string, context?: { beforeText?: string; afterText?: string }) => {
    if (!context || (!context.beforeText && !context.afterText)) {
      return fullText.indexOf(selectedText);
    }

    const possibleIndices: number[] = [];
    let startIndex = 0;
    
    // Find all occurrences of the selected text
    while (true) {
      const index = fullText.indexOf(selectedText, startIndex);
      if (index === -1) break;
      possibleIndices.push(index);
      startIndex = index + 1;
    }

    // If only one occurrence, return it
    if (possibleIndices.length === 1) {
      return possibleIndices[0];
    }

    // Find the occurrence that best matches the context
    return possibleIndices.reduce((bestIndex, currentIndex) => {
      const beforeMatch = context.beforeText 
        ? fullText.substring(Math.max(0, currentIndex - context.beforeText.length), currentIndex).includes(context.beforeText)
        : true;
      
      const afterMatch = context.afterText
        ? fullText.substring(currentIndex + selectedText.length, currentIndex + selectedText.length + context.afterText.length).includes(context.afterText)
        : true;

      if (beforeMatch && afterMatch) {
        return currentIndex;
      }
      return bestIndex;
    }, possibleIndices[0]);
  };

  const NoteInput = memo(({ onSave, onCancel, initialNote }: { 
    onSave: (note: string, file?: File | null) => void; 
    onCancel: () => void;
    initialNote?: string;
  }) => {
    const [value, setValue] = useState(initialNote || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update value when initialNote changes
    useEffect(() => {
      setValue(initialNote || '');
    }, [initialNote]);

    // Focus textarea when component mounts
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Place cursor at the end
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, []);

    const handleSave = async () => {
      setError(null);
      if (value.trim().length < MIN_NOTE_LENGTH) {
        setError(`Note must be at least ${MIN_NOTE_LENGTH} characters`);
        return;
      }

      setIsSubmitting(true);
      setIsCreatingNote(true);
      try {
        await onSave(value, selectedFile);
        setValue('');
        setSelectedFile(null);
      } catch (error) {
        console.error('Failed to save note:', error);
        setError('Failed to save note. Please try again.');
      } finally {
        setIsSubmitting(false);
        setIsCreatingNote(false);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Check file type
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        if (!isImage && !isPDF) {
          setError('Only images and PDF files are allowed');
          return;
        }
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setError('File size must be less than 5MB');
          return;
        }
        
        setSelectedFile(file);
        setError(null);
      }
    };

    const handleRemoveFile = () => {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Submit on Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    return (
      <div className="flex flex-col gap-2 p-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a note..."
          className="min-h-[100px]"
        />
        
        {/* File Upload Section */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Attach File
          </Button>
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="truncate max-w-[150px]">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!isSubmitting) {
                onCancel();
              }
            }} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSubmitting || value.trim().length < MIN_NOTE_LENGTH}
          >
            {isSubmitting ? 'Saving...' : editingNote ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    );
  });

  NoteInput.displayName = 'NoteInput'

  const NotePopover = () => {
    useEffect(() => {
      if (showNotePopover || editingNote) {
        setShowNotePopover(true);
      }
    }, [showNotePopover, editingNote]);

    if (!showNotePopover && !editingNote) return null;

    return createPortal(
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center"
        style={{ zIndex: 2147483645 }}
      >
        <div className="bg-white rounded-lg shadow-lg p-4 w-[400px]">
          <NoteInput 
            onSave={async (note, file) => {
              try {
                if (editingNote) {
                  await handleNoteUpdate(note, file);
                } else {
                  await handleNoteCreation(note, file);
                }
                setShowNotePopover(false);
                setIsCreatingNote(false);
                setEditingNote(null);
              } catch (error) {
                console.error('Failed to save note:', error);
              }
            }}
            onCancel={() => {
              setIsCreatingNote(false);
              setEditingNote(null);
              setShowNotePopover(false);
            }}
            initialNote={editingNote?.note}
          />
        </div>
      </div>,
      document.body
    );
  };

  const renderSkills = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {resumeData.skills.map((skill, index) => {
          const skillNotes = findNotesForItem(notes, 'skills', skill.name);
          return (
            <div 
              key={index} 
              className={cn(
                "rounded-full bg-gray-100 px-3 py-1 text-sm flex items-center gap-2",
                editMode[SECTIONS.SKILLS] && isEditable && "border border-dashed border-gray-300"
              )}
              data-section="skills"
            >
              <span data-field="name">
                <EditableText 
                  value={skill.name} 
                  section={SECTIONS.SKILLS} 
                  index={index} 
                  field="name" 
                />
              </span>
              {skillNotes.length > 0}
            </div>
          );
        })}
      </div>
    );
  };

  const handleNoteCreation = async (noteText: string, file?: File | null) => {
    if (!selectedText || !slugId || !lastSelectionRef.current) {
      console.error('Missing required data for note creation');
      return;
    }

    try {
      const noteData: CreateNoteRequest = {
        identifier: `${selectedText.section}-${selectedText.text}-${Date.now()}`,
        note: noteText,
        section: selectedText.section,
        selected_text: selectedText.text,
        context: selectedText.context ? {
          beforeText: selectedText.context.beforeText || '',
          afterText: selectedText.context.afterText || '',
          parentElement: selectedText.context.parentElement || ''
        } : undefined
      };

      let formData: FormData | null = null;
      if (file) {
        formData = new FormData();
        formData.append('note_file', file);
        // Append other fields to FormData
        Object.entries(noteData).forEach(([key, value]) => {
          if (value !== undefined) {
            formData!.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        });
      }

      const newNote = await createNoteAPI(slugId, formData || noteData);
      
      // Update notes state
      setNotes(prev => ({
        ...prev,
        [noteData.identifier]: newNote
      }));

      // Reset states
      setSelectedText(null);
      setShowNotePopover(false);
      lastSelectionRef.current = null;

      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const handleNoteUpdate = async (noteText: string, file?: File | null) => {
    if (!editingNote || !slugId) {
      console.error('Missing required data for note update');
      return;
    }

    try {
      // Create a new object without file-related fields
      const { identifier, section, selected_text, context } = editingNote;
      const noteData: CreateNoteRequest = {
        identifier,
        note: noteText,
        section,
        selected_text,
        context
      };

      let formData: FormData | null = null;
      if (file) {
        formData = new FormData();
        formData.append('note_file', file);
        // Append other fields to FormData
        Object.entries(noteData).forEach(([key, value]) => {
          if (value !== undefined) {
            formData!.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        });
      }

      const updatedNote = await updateNoteAPI(slugId, formData || noteData);
      
      // Update notes state
      setNotes(prev => ({
        ...prev,
        [editingNote.identifier]: updatedNote
      }));

      // Reset states
      setEditingNote(null);
      setShowNotePopover(false);
      setIsCreatingNote(false);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      if (!slugId) return;
      
      try {
        const allNotes = await getAllNotes(slugId);
        console.log('Fetched notes:', allNotes);
        
        const notesMap = allNotes.reduce((acc, note) => ({
          ...acc,
          [note.identifier]: note
        }), {});
        
        setNotes(notesMap);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [slugId]);

  useEffect(() => {
    const handleTextSelection = () => {
      if (isCreatingNote) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!isCreatingNote) {
          setSelectedText(null);
          setShowNotePopover(false);
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();
      
      console.log('Selection detected:', { text });
      
      if (!text || text.length < MIN_SELECTION_LENGTH) {
        console.log('Text too short or empty');
        if (!isCreatingNote) {
          setSelectedText(null);
          setShowNotePopover(false);
        }
        return;
      }

      // Get the actual element, handling both text nodes and element nodes
      const ancestor = range.commonAncestorContainer;
      const element = ancestor.nodeType === Node.TEXT_NODE 
        ? ancestor.parentElement
        : ancestor as Element;

      console.log('Selected element:', element);

      // Now safely check for note-highlight
      if (element?.closest('.note-highlight')) {
        console.log('Cannot create note inside existing note');
        return;
      }

      // Find the closest section element
      const sectionCard = element?.closest('[data-section]');
      if (!sectionCard) {
        console.log('No section found for selection:', element);
        return;
      }

      const section = sectionCard.getAttribute('data-section');
      if (!section) {
        console.log('No section attribute found on:', sectionCard);
        return;
      }

      console.log('Found section:', section);

      // Get the parent element with data-field attribute
      const fieldElement = element?.closest('[data-field]');
      const field = fieldElement?.getAttribute('data-field');

      console.log('Found field:', { field, element: fieldElement });

      // Get the full text content for context
      const parentText = fieldElement?.textContent || '';
      const selectionStart = parentText.indexOf(text);
      const selectionEnd = selectionStart + text.length;

      // Store selection info
      lastSelectionRef.current = { text, range, section };

      // Get selection coordinates and viewport dimensions
      const rect = range.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      
      console.log('Selection coordinates:', {
        rect,
        scrollTop,
        viewportHeight
      });
      
      // Calculate the best position for the popover
      const POPOVER_HEIGHT = 300; // Height of the popover
      const POPOVER_WIDTH = 320;
      
      // Calculate available space below and above the selection
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Determine if we should show above or below
      const showAbove = spaceBelow < POPOVER_HEIGHT && spaceAbove > spaceBelow;
      
      // Calculate vertical position
      let top;
      if (showAbove) {
        // Position above: align to viewport if not enough space
        top = Math.max(PADDING, rect.top + scrollTop - POPOVER_HEIGHT - 10);
      } else {
        // Position below: ensure it doesn't go below viewport
        const proposedTop = rect.bottom + scrollTop + 10;
        const maxTop = window.innerHeight + scrollTop - POPOVER_HEIGHT - PADDING;
        top = Math.min(proposedTop, maxTop);
      }
      
      // Calculate horizontal position
      let left = rect.left + (rect.width / 2);
      
      // Ensure popover stays within horizontal bounds
      left = Math.max(POPOVER_WIDTH / 2 + PADDING, left); // Not too far left
      left = Math.min(window.innerWidth - POPOVER_WIDTH / 2 - PADDING, left); // Not too far right

      console.log('Calculated popover position:', { 
        top, 
        left, 
        showAbove,
        spaceBelow,
        spaceAbove,
        viewportHeight,
        scrollTop
      });
      
      const newSelectedText = {
        text,
        range,
        position: {
          top,
          left
        },
        section,
        context: {
          beforeText: parentText.substring(0, selectionStart).trim(),
          afterText: parentText.substring(selectionEnd).trim(),
          parentElement: field || undefined
        }
      };

      console.log('Creating note with context:', newSelectedText);
      setSelectedText(newSelectedText);
      setShowNotePopover(true);
    };

    const handleSelectionEvent = (e: MouseEvent | KeyboardEvent) => {
      // Only handle mouseup events and specific keyboard events
      if (
        e.type === 'keyup' && 
        !(e as KeyboardEvent).ctrlKey && 
        !(e as KeyboardEvent).metaKey
      ) {
        return;
      }
      
      // Small delay to ensure selection is complete
      setTimeout(handleTextSelection, 10);
    };

    // Handle click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        !isCreatingNote
      ) {
        setSelectedText(null);
        setShowNotePopover(false);
      }
    };

    document.addEventListener('mouseup', handleSelectionEvent);
    document.addEventListener('keyup', handleSelectionEvent);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelectionEvent);
      document.removeEventListener('keyup', handleSelectionEvent);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreatingNote]);

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Personal Info - Not Collapsible */}
      <Card className="mb-8 section-card" data-section="personal_info">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <EditableText 
                value={resumeData.personal_info.name || 'Name not available'} 
                section={SECTIONS.PERSONAL_INFO} 
                index={0} 
                field="name" 
              />
            </CardTitle>
            {isEditable && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleEditMode(SECTIONS.PERSONAL_INFO)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <p>
              {resumeData.personal_info.email !== '-' && (
                <>
                  <EditableText 
                    value={resumeData.personal_info.email} 
                    section={SECTIONS.PERSONAL_INFO} 
                    index={0} 
                    field="email" 
                  />
                </>
              )}
              {resumeData.personal_info.contact_no !== '-' && resumeData.personal_info.contact_no && (
                <>
                  {' • '}
                  <EditableText 
                    value={resumeData.personal_info.contact_no} 
                    section={SECTIONS.PERSONAL_INFO} 
                    index={0} 
                    field="contact_no" 
                  />
                </>
              )}
            </p>
            {resumeData.personal_info.gender !== '-' && (
              <p className="text-sm text-gray-500">
                Gender: {' '}
                <EditableText 
                  value={resumeData.personal_info.gender} 
                  section={SECTIONS.PERSONAL_INFO} 
                  index={0} 
                  field="gender" 
                />
              </p>
            )}
            {renderSocialLinks()}
            {editMode[SECTIONS.PERSONAL_INFO] && isEditable && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  <EditableText 
                    value={resumeData.personal_info.linkedin || '-'} 
                    section={SECTIONS.PERSONAL_INFO} 
                    index={0} 
                    field="linkedin" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <EditableText 
                    value={resumeData.personal_info.github || '-'} 
                    section={SECTIONS.PERSONAL_INFO} 
                    index={0} 
                    field="github" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <EditableText 
                    value={resumeData.personal_info.website || '-'} 
                    section={SECTIONS.PERSONAL_INFO} 
                    index={0} 
                    field="website" 
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Skills */}
      {resumeData.skills?.length > 0 && (
        <Card className={cn("mb-8 section-card", !openSections[UI_SECTIONS.SKILLS] && "!gap-0")} data-section="skills">
          <SectionHeader title="Skills" section={UI_SECTIONS.SKILLS} />
          <div className={cn(
            "grid transition-all duration-200",
            openSections[UI_SECTIONS.SKILLS] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {renderSkills()}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Work Experience */}
      {resumeData.work_experience?.filter(exp => exp.company_name !== '').length > 0 && (
        <Card className={cn("mb-8 section-card", !openSections[UI_SECTIONS.EXPERIENCE] && "!gap-0")} data-section="work_experience">
          <SectionHeader title="Work Experience" section={UI_SECTIONS.EXPERIENCE} />
          <div className={cn(
            "grid transition-all duration-200",
            openSections[UI_SECTIONS.EXPERIENCE] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.work_experience
                  .filter(exp => exp.company_name !== '')
                  .map((exp, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "mb-4",
                        editMode[SECTIONS.WORK_EXPERIENCE] && isEditable && "border border-dashed border-gray-200 p-2 rounded"
                      )}
                      data-section={SECTIONS.WORK_EXPERIENCE}
                    >
                      <h3 className="font-semibold" data-field="company_name">
                        <EditableText 
                          value={exp.company_name} 
                          section={SECTIONS.WORK_EXPERIENCE} 
                          index={index} 
                          field="company_name" 
                        />
                      </h3>
                      <p className="text-sm text-gray-500">
                        <span data-field="job_title">
                          <EditableText 
                            value={exp.job_title} 
                            section={SECTIONS.WORK_EXPERIENCE} 
                            index={index} 
                            field="job_title" 
                          />
                        </span>
                        {' • '}
                        <span data-field="duration">
                          <EditableText 
                            value={exp.duration} 
                            section={SECTIONS.WORK_EXPERIENCE} 
                            index={index} 
                            field="duration" 
                          />
                        </span>
                      </p>
                      {exp.key_responsbilities.length > 0 && (
                        <ul className="mt-2 list-disc pl-5">
                          {exp.key_responsbilities.map((resp, i) => (
                            <li key={i} className="text-sm">
                              <EditableResponsibility 
                                value={resp} 
                                section={SECTIONS.WORK_EXPERIENCE} 
                                itemIndex={index} 
                                respIndex={i} 
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                      {index < resumeData.work_experience.filter(exp => exp.company_name !== '').length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Projects */}
      {resumeData.projects?.length > 0 && (
        <Card className={cn("mb-8 section-card", !openSections[UI_SECTIONS.PROJECTS] && "!gap-0")} data-section="projects">
          <SectionHeader title="Projects" section={UI_SECTIONS.PROJECTS} />
          <div className={cn(
            "grid transition-all duration-200",
            openSections[UI_SECTIONS.PROJECTS] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.projects.map((project, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "mb-4",
                      editMode[SECTIONS.PROJECTS] && isEditable && "border border-dashed border-gray-200 p-2 rounded"
                    )}
                    data-section={SECTIONS.PROJECTS}
                  >
                    <h3 className="font-semibold">
                      <span data-field="title">
                        <EditableText 
                          value={project.title} 
                          section={SECTIONS.PROJECTS} 
                          index={index} 
                          field="title" 
                        />
                      </span>
                    </h3>
                    <p className="text-sm">
                      <span data-field="description">
                        <EditableText 
                          value={project.description} 
                          section={SECTIONS.PROJECTS} 
                          index={index} 
                          field="description" 
                          isMultiline={true}
                        />
                      </span>
                    </p>
                    {project.skills_used && project.skills_used.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.skills_used.map((skill, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "rounded-full bg-gray-100 px-2 py-0.5 text-xs",
                              editMode[SECTIONS.PROJECTS] && isEditable && "border border-dashed border-gray-300"
                            )}
                          >
                            <span data-field={`skill_${i}`}>
                              <EditableText 
                                value={skill.name} 
                                section={SECTIONS.PROJECTS} 
                                index={index} 
                                field={`skill_${i}`} 
                              />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {index < resumeData.projects.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Education */}
      {resumeData.qualifications?.length > 0 && (
        <Card className={cn("mb-8 section-card", !openSections[UI_SECTIONS.EDUCATION] && "!gap-0")} data-section="qualifications">
          <SectionHeader title="Education" section={UI_SECTIONS.EDUCATION} />
          <div className={cn(
            "grid transition-all duration-200",
            openSections[UI_SECTIONS.EDUCATION] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}>
            <div className="overflow-hidden">
              <CardContent>
                {resumeData.qualifications.map((qual, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "mb-4",
                      editMode[SECTIONS.QUALIFICATIONS] && isEditable && "border border-dashed border-gray-200 p-2 rounded"
                    )}
                    data-section={SECTIONS.QUALIFICATIONS}
                  >
                    <h3 className="font-semibold">
                      <span data-field="title">
                        <EditableText 
                          value={qual.title} 
                          section={SECTIONS.QUALIFICATIONS} 
                          index={index} 
                          field="title" 
                        />
                      </span>
                    </h3>
                    <p className="text-sm">
                      <span data-field="description">
                        <EditableText 
                          value={qual.description} 
                          section={SECTIONS.QUALIFICATIONS} 
                          index={index} 
                          field="description" 
                          isMultiline={true}
                        />
                      </span>
                    </p>
                    {index < resumeData.qualifications.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      <NotePopover />
    </div>
  )
}