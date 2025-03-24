import { Box, Card, Paper, Typography } from '@mui/material';
import  useDynamicHeight from 'hooks/useDynamicHeight';




const HighlightsPreview = () => {
  const containerHeight = useDynamicHeight();
  return (
    <Paper
    elevation={3} 
    sx={{ 
      height: {
        xs: '700px',
        sm: '700px',
        md: containerHeight,
        lg: containerHeight,
      },
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
      gap: '8px',
    }}>
      <Box 
      sx={{
        gridColumn: 'span 4 / span 4',
        border:  '1px solid black',
      }}
      >
        <Typography variant="h4" sx={{ p: 2, fontWeight: 600 }}>
          Blog Title Here
        </Typography>

      </Box>

      <Box
      sx={{
        gridColumn: 'span 2 / span 2',
        gridRow: 'span 3 / span 3',
        gridRowStart: 2,
        border:  '1px solid black',
      }}
      >
      <Card
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Image Here  
      </Card>
 
      
      
      </Box>

      <Box
      sx={{
        gridColumn: 'span 2 / span 2',
        gridColumnStart: 1,
        gridRowStart: 5,
        border:  '1px solid black',
      }}
      >
        <Card
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          SDGs Here
        </Card>
      </Box>

      <Box       
      sx={{
        gridColumn: 'span 2 / span 2',
        gridRow: 'span 5 / span 5',
        gridColumnStart: 3,
        gridRowStart: 2,
        border:  '1px solid black',
      }}
      >
        <Typography variant= 'body1'
        sx={{
          p: 2,
        }}>
          Content Here <br/>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
        </Typography>
      </Box>
    </Paper>
  )
}

export default HighlightsPreview;