import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box } from '@mui/material';

interface RichTextViewerProps {
  content: string;
}

const RichTextViewer = ({ content }: RichTextViewerProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false, // Make it read-only
  });

  return (
    <Box sx={{
      '& .ProseMirror': {
        '& > * + *': {
          marginTop: '0.75em',
        },
        '& ul, & ol': {
          padding: '0 1rem',
        },
        '& h1': {
          fontSize: '2em',
          fontWeight: 'bold',
        },
        '& h2': {
          fontSize: '1.5em',
          fontWeight: 'bold',
        },
        '& h3': {
          fontSize: '1.25em',
          fontWeight: 'bold',
        },
        '& blockquote': {
          borderLeft: '3px solid #999',
          paddingLeft: '1rem',
          fontStyle: 'italic',
        },
        '& code': {
          backgroundColor: '#f5f5f5',
          padding: '0.2em 0.4em',
          borderRadius: '3px',
        },
      }
    }}>
      <EditorContent editor={editor} />
    </Box>
  );
};

export default RichTextViewer;