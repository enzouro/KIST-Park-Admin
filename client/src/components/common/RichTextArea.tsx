import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
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
          backgroundColor: 'background.paper'
        }}
      >
        {/* Text Formatting Toggle Buttons */}
        <ToggleButtonGroup 
          size="small" 
          exclusive
        >
          <ToggleButton 
            value="bold"
            selected={editor.isActive('bold')}
            onChange={() => handleFormatToggle('bold')}
          >
            <FormatBold />
          </ToggleButton>
          <ToggleButton 
            value="italic"
            selected={editor.isActive('italic')}
            onChange={() => handleFormatToggle('italic')}
          >
            <FormatItalic />
          </ToggleButton>
          <ToggleButton 
            value="strike"
            selected={editor.isActive('strike')}
            onChange={() => handleFormatToggle('strike')}
          >
            <FormatStrikethrough />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Heading Select */}
        <FormControl 
          variant="outlined" 
          size="small" 
          sx={{ ml: 2, minWidth: 120 }}
        >
          <InputLabel>Heading</InputLabel>
          <Select
            label="Heading"
            value=""
            onChange={handleHeadingChange}
          >
            <MenuItem value={0}>Paragraph</MenuItem>
            <MenuItem value={1}>Heading 1</MenuItem>
            <MenuItem value={2}>Heading 2</MenuItem>
            <MenuItem value={3}>Heading 3</MenuItem>
          </Select>
        </FormControl>

        {/* List Buttons */}
        <ToggleButtonGroup 
          size="small" 
          exclusive
          sx={{ ml: 2 }}
        >
          <ToggleButton 
            value="bulletList"
            selected={editor.isActive('bulletList')}
            onChange={() => handleFormatToggle('bulletList')}
          >
            <FormatListBulleted />
          </ToggleButton>
          <ToggleButton 
            value="orderedList"
            selected={editor.isActive('orderedList')}
            onChange={() => handleFormatToggle('orderedList')}
          >
            <FormatListNumbered />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Code Button */}
        <ToggleButton 
          value="code"
          selected={editor.isActive('code')}
          onChange={() => handleFormatToggle('code')}
          sx={{ ml: 2 }}
        >
          <Code />
        </ToggleButton>
      </Box>

      {/* Editor Content */}
      <Box 
        sx={{ 
          p: 2, 
          minHeight: 200,
          '& .ProseMirror': {
            outline: 'none',
            '&:focus': {
              outline: 'none'
            }
          }
        }}
      >
        <EditorContent editor={editor} 

        />
      </Box>
    </Box>
  );
};

export default TiptapEditor;