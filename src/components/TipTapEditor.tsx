import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useState } from 'react';

export default function TipTapEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const safeValue = typeof value === 'string' ? value : '';
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: safeValue,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
    // eslint-disable-next-line
  }, [value]);

  if (!editor) return <div className="border p-3 bg-gray-100 rounded">Memuatkan editor...</div>;

  return (
    <div className="border-2 border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="flex gap-2 p-2 border-b border-gray-300 bg-gray-50">
        <button 
          type="button" 
          title="Bold" 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
        </button>
        <button 
          type="button" 
          title="Italic" 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4v3m0 0v3m0-3h4m-4 0h4" /></svg>
        </button>
        <button 
          type="button" 
          title="Strike" 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20h12" /></svg>
        </button>
        <button 
          type="button" 
          title="Bullet List" 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="6" cy="6" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><line x1="10" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" /><line x1="10" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" /><line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
        <button 
          type="button" 
          title="Numbered List" 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><text x="6" y="6" fontSize="12" fill="currentColor">1.</text><line x1="10" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" /><text x="6" y="12" fontSize="12" fill="currentColor">2.</text><line x1="10" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" /><text x="6" y="18" fontSize="12" fill="currentColor">3.</text><line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
        <button 
          type="button" 
          title="Insert Image" 
          onClick={(e) => {
            e.preventDefault();
            setShowImageInput(!showImageInput);
          }} 
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
      </div>
      
      {showImageInput && (
        <div className="p-3 border-b border-gray-300 bg-gray-50 flex gap-2">
          <input
            type="text"
            placeholder="Masukkan URL gambar..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (imageUrl && imageUrl.trim()) {
                editor?.chain().focus().setImage({ src: imageUrl.trim() }).run();
                setImageUrl('');
                setShowImageInput(false);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowImageInput(false);
              setImageUrl('');
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Batal
          </button>
        </div>
      )}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] p-4 text-gray-900" 
        style={{ background: '#ffffff', color: '#1f2937', fontSize: '1rem' }} 
      />
      <style>{`
        .ProseMirror {
          color: #1f2937 !important;
          background: #ffffff !important;
          caret-color: #2563eb !important;
          min-height: 180px;
          outline: none;
        }
        .ProseMirror:focus {
          outline: none;
          border: none;
        }
        .ProseMirror::placeholder {
          color: #9ca3af !important;
        }
        .ProseMirror p {
          color: #1f2937 !important;
          margin: 0.5em 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          color: #1f2937 !important;
          padding-left: 1.5em;
        }
        .ProseMirror li {
          color: #1f2937 !important;
        }
        .ProseMirror strong {
          color: #111827 !important;
          font-weight: 700;
        }
        .ProseMirror em {
          color: #374151 !important;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          color: #111827 !important;
          font-weight: 700;
        }
        .ProseMirror img {
          max-width: 400px;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
          display: block;
        }
      `}</style>
    </div>
  );
}
