import React, { useState, useRef } from 'react';
import { 
  Box, 
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  Checkbox,
  ListItemText,
  IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import CloseIcon from '@mui/icons-material/Close';

// List of SDGs (Sustainable Development Goals)
const SDG_OPTIONS = [
  'SDG-1 No Poverty',
  'SDG-2 Zero Hunger',
  'SDG-3 Good Health and Well-being',
  'SDG-4 Quality Education',
  'SDG-5 Gender Equality',
  'SDG-6 Clean Water and Sanitation',
  'SDG-7 Affordable and Clean Energy',
  'SDG-8 Decent Work and Economic Growth',
  'SDG-9 Industry, Innovation and Infrastructure',
  'SDG-10 Reduced Inequalities',
  'SDG-11 Sustainable Cities and Communities',
  'SDG-12 Responsible Consumption and Production',
  'SDG-13 Climate Action',
  'SDG-14 Life Below Water',
  'SDG-15 Life on Land',
  'SDG-16 Peace, Justice and Strong Institutions',
  'SDG-17 Partnerships for the Goals'
];

interface SDGOption {
  _id: string;
  name: string;
}

interface SDGSelectProps {
  value: (string | SDGOption)[];
  onChange: (values: string[]) => void;
  error?: boolean;
}

const SDGSelect: React.FC<SDGSelectProps> = ({ value = [], onChange, error }) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Process incoming values to ensure consistent format
 // Process incoming values to ensure consistent format
const processValue = (val: (string | SDGOption)[]): string[] => {
  return val.flatMap(v => {
    if (typeof v === 'object' && v !== null) {
      // If the value is an object, extract the name or _id
      return v.name || v._id;
    }
    // If the value is a string but contains multiple SDGs, split them all
    if (typeof v === 'string' && v.includes(',')) {
      return v.split(',').map(s => s.trim());
    }
    return v;
  }).filter(Boolean); // Remove any empty values
};

  const processedValue = processValue(value);

  const handleChange = (event: SelectChangeEvent<typeof processedValue>) => {
    const {
      target: { value: newValue },
    } = event;
    
    // Ensure we're always working with an array
    const selectedValues = Array.isArray(newValue) ? newValue : [newValue];
    
    // Filter out any empty values and normalize the array
    const filteredValues = selectedValues.filter(Boolean);
    onChange(filteredValues);
  };
  

  const handleDelete = (sdgToDelete: string) => {
    const newValues = processedValue.filter(sdg => sdg !== sdgToDelete);
    onChange(newValues);
  };

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  const closeDropdown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleClose();
  };

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
        width: selectRef.current?.clientWidth,
      },
    },
    MenuListProps: {
      sx: { pt: 0 }
    },
  };

  return (
    <FormControl fullWidth error={error} ref={selectRef}>
      <InputLabel id="sdg-select-label">SDGs</InputLabel>
      <Select
        labelId="sdg-select-label"
        id="sdg-select"
        multiple
        value={processedValue}
        onChange={handleChange}
        onOpen={handleOpen}
        onClose={handleClose}
        open={open}
        input={<OutlinedInput label="SDGs" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((sdg) => (
              <Chip 
                key={sdg}
                label={sdg}
                onDelete={() => handleDelete(sdg)}
                onMouseDown={(event) => event.stopPropagation()}
                size="small"
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        <Box 
          sx={{ 
            position: 'sticky', 
            top: 0, 
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            p: 1,
            zIndex: 1
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="subtitle2">
            Select SDGs
          </Typography>
          <IconButton 
            size="small" 
            onClick={closeDropdown}
            aria-label="Close dropdown"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {SDG_OPTIONS.map((sdg) => (
          <MenuItem key={sdg} value={sdg}>
            <Checkbox checked={processedValue.includes(sdg)} />
            <ListItemText primary={sdg} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SDGSelect;