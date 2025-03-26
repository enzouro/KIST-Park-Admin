import { Box } from '@mui/material';
import {
  SDG1, SDG2, SDG3, SDG4, SDG5, SDG6, SDG7, SDG8, SDG9,
  SDG10, SDG11, SDG12, SDG13, SDG14, SDG15, SDG16, SDG17
} from 'assets';

interface SDGImagesProps {
  sdgs: string[];
  size?: number;
}

const SDGImages = {
  SDG1, SDG2, SDG3, SDG4, SDG5, SDG6, SDG7, SDG8, SDG9,
  SDG10, SDG11, SDG12, SDG13, SDG14, SDG15, SDG16, SDG17
};

const SDGImagesList = ({ sdgs, size = 45 }: SDGImagesProps) => {
  if (!sdgs?.length) return null;

  // Process the incoming SDG string into an array
  const processSdgs = (sdgInput: string[]): string[] => {
    // If the first element contains commas, split it
    if (sdgInput[0]?.includes(',')) {
      return sdgInput[0].split(',').map(s => s.trim());
    }
    return sdgInput;
  };

  const processedSdgs = processSdgs(sdgs);
  console.log('Processed SDGs:', processedSdgs);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}
    >
      {processedSdgs.map((sdgData, index) => {
        // Extract the SDG number from the string (e.g., "SDG-1" from "SDG-1 No Poverty")
        const match = sdgData.match(/SDG-(\d+)/);
        if (!match) {
          console.warn(`Invalid SDG format: ${sdgData}`);
          return null;
        }

        const sdgNumber = match[1];
        const sdgKey = `SDG${sdgNumber}` as keyof typeof SDGImages;

        if (!SDGImages[sdgKey]) {
          console.warn(`No image found for SDG: ${sdgData}`);
          return null;
        }

        return (
          <Box
            key={index}
            component="img"
            src={SDGImages[sdgKey]}
            alt={sdgData}
            title={sdgData}
            sx={{
              height: size,
              width: 'auto',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          />
        );
      })}
    </Box>
  );
};

export default SDGImagesList;