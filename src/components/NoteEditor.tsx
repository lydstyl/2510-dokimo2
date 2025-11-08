'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteEditorProps {
  note?: string;
  onSave: (note: string) => Promise<void>;
  entityType: 'landlord' | 'property' | 'tenant' | 'lease';
}

export function NoteEditor({ note, onSave, entityType }: NoteEditorProps) {
  const t = useTranslations('common');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedNote(note || '');
    setIsEditing(false);
    setShowPreview(false);
  };

  if (!isEditing && !note) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + {t('addNote')}
        </button>
      </div>
    );
  }

  if (!isEditing && note) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{t('note')}</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t('edit')}
          </button>
        </div>
        <div className="prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">{t('editNote')}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showPreview ? 'Éditer' : 'Prévisualiser'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-2">{t('markdownSupported')}</p>
      </div>

      {showPreview ? (
        <div className="p-3 bg-white border border-gray-300 rounded min-h-[120px]">
          {editedNote ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editedNote}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{t('noNote')}</p>
          )}
        </div>
      ) : (
        <textarea
          value={editedNote}
          onChange={(e) => setEditedNote(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded min-h-[120px] font-mono text-sm"
          placeholder={`## Titre\n- Point 1\n- Point 2\n\n**Important:** texte en gras`}
        />
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
        >
          {isSaving ? t('loading') : t('save')}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 text-sm"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
