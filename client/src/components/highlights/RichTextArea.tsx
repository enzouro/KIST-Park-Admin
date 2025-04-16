import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  Select, 
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatStrikethrough, 
  FormatListBulleted, 
  FormatListNumbered, 
  Code 
} from '@mui/icons-material';

const TiptapEditor = ({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (content: string) => void 
}) => {
  const editor = useEditor({
    extensions: [
      // Configure heading only once through StarterKit
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleFormatToggle = (
    formatType: 'bold' | 'italic' | 'strike' | 'bulletList' | 'orderedList' | 'code'
  ) => {
    if (!editor) return;

    switch (formatType) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
    }
  };

  const handleHeadingChange = (event: SelectChangeEvent<string>) => {
    if (!editor) return;
    const level = parseInt(event.target.value);
    
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2, 
        overflow: 'hidden' 
      }}
    >
      {/* Toolbar */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {/* Text Formatting Toggle Buttons */}
        <ToggleButtonGroup 
          size="small" 
          aria-label="text formatting"
        >
          <ToggleButton 
            value="bold"
            selected={editor.isActive('bold')}
            onClick={() => handleFormatToggle('bold')}
            aria-label="bold"
          >
            <FormatBold />
          </ToggleButton>
          <ToggleButton 
            value="italic"
            selected={editor.isActive('italic')}
            onClick={() => handleFormatToggle('italic')}
            aria-label="italic"
          >
            <FormatItalic />
          </ToggleButton>
          <ToggleButton 
            value="strike"
            selected={editor.isActive('strike')}
            onClick={() => handleFormatToggle('strike')}
            aria-label="strikethrough"
          >
            <FormatStrikethrough />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Heading Select */}
        <FormControl 
          variant="outlined" 
          size="small" 
          sx={{ minWidth: 120 }}
        >
          <InputLabel id="heading-select-label">Heading</InputLabel>
          <Select
            labelId="heading-select-label"
            label="Heading"
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' : '0'
            }
            onChange={handleHeadingChange}
          >
            <MenuItem value="0">Paragraph</MenuItem>
            <MenuItem value="1">Heading 1</MenuItem>
            <MenuItem value="2">Heading 2</MenuItem>
            <MenuItem value="3">Heading 3</MenuItem>
          </Select>
        </FormControl>

        {/* List Buttons */}
        <ToggleButtonGroup 
          size="small" 
          aria-label="list formatting"
        >
          <ToggleButton 
            value="bulletList"
            selected={editor.isActive('bulletList')}
            onClick={() => handleFormatToggle('bulletList')}
            aria-label="bullet list"
          >
            <FormatListBulleted />
          </ToggleButton>
          <ToggleButton 
            value="orderedList"
            selected={editor.isActive('orderedList')}
            onClick={() => handleFormatToggle('orderedList')}
            aria-label="numbered list"
          >
            <FormatListNumbered />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Code Button */}
        <ToggleButton 
          value="code"
          selected={editor.isActive('code')}
          onClick={() => handleFormatToggle('code')}
          aria-label="code"
        >
          <Code />
        </ToggleButton>
      </Box>

      {/* Editor Content */}
      <Box 
        sx={{ 
          position: 'relative',
          minHeight: 200,
          cursor: 'text',
          '& .ProseMirror': {
            outline: 'none',
            padding: 2,
            minHeight: '200px',
            height: '100%',
            width: '100%',
            '&:focus': {
              outline: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.05)'
            },
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.03)'
            },
            // Typography styles
            '& h1': { fontSize: '1.7rem', marginBottom: '0.5em', fontWeight: 'bold' },
            '& h2': { fontSize: '1.5rem', marginBottom: '0.4em', fontWeight: 'bold' },
            '& h3': { fontSize: '1.3rem', marginBottom: '0.3em', fontWeight: 'bold' },
            '& p': { marginBottom: '0.8em' },
            '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '1em' },
            '& li': { marginBottom: '0.2em' },
            '& code': { 
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }
          }
        }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default TiptapEditor;