import { useState } from 'react';
import { useList } from '@pankod/refine-core';
import { 
  Typography, 
  Box, 
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Paper,
  useTheme,
  useMediaQuery
} from '@pankod/refine-mui';
import HighlightsCard from 'components/dashboard/HighlightsCard';
import PressReleaseCard from 'components/dashboard/PressReleaseCard';
import { Construction } from '@mui/icons-material';
import { MenuItem, TextField } from '@mui/material';
import { useNavigate } from '@pankod/refine-react-router-v6';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Highlight {
  _id: string;
  title: string;
  location: string;
  status: string;
  date: string;
  category: {
    _id: string;
    category: string;
  };
  images:string[];
  seq: number;
}

interface PressRelease {
  _id: string;
  title: string;
  publisher: string;
  date: string;
  link: string;
  image: string[];
  seq: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Home = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch data for both sections
  const { data: highlightsData, isLoading, error } = useList<Highlight>({
    resource: "highlights",
  });

  const { data: categoriesData } = useList({
    resource: "categories",
  });

  const processedHighlights = highlightsData?.data.filter(highlight => {
    if (selectedCategory === 'all') return true;
    return highlight.category?._id === selectedCategory;
  });

  // Add this query for press releases
  const { data: pressReleasesData, isLoading: pressReleasesLoading } = useList<PressRelease>({
    resource: "press-release",
  });

  // Add this handler for press release view
  const handlePressReleaseView = (id: string) => {
    navigate(`/press-release/show/${id}`);
  };

  if (isLoading) {
    return <Box sx={{ p: 2 }}>Loading...</Box>;
  }

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCategory(event.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleView = (id: string) => {
    navigate(`/highlights/show/${id}`); // Redirect to the preview page
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ 
      px: { xs: 1, sm: 2, md: 3},
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%', // Add this
      boxSizing: 'border-box' // Add this
    }}>
      <Typography 
        fontSize={{ xs: 20, sm: 25 }} 
        fontWeight={700} 
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        Dashboard
      </Typography>

      <Paper elevation={3} sx={{ 
        overflow: 'hidden',  // Add this
        width: '100%',
        display: 'flex',     // Add this
        flexDirection: 'column', // Add this
        height: {            // Add this
          xs: 'auto',
          sm: 'auto',
          md: 'auto'
        }
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ 
              px: { xs: 1, sm: 2 },
              '& .MuiTab-root': { 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                textTransform: 'none',
                minHeight: { xs: '48px', sm: '64px' }
              }
            }}
          >
            <Tab label="Highlights" />
            <Tab label="Press Releases" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Category Filter */}
          <Box sx={{ mb: 2, width: { xs: '100%', sm: 'auto', },
              maxWidth: '100%',

            }}>
            <TextField
              select
              size="small"
              label="Filter by Category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              fullWidth={isMobile}
              
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categoriesData?.data.map((category: any) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.category}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ 
              width: '100%',
              margin: 0, // Add this
              pl: 0 // Add this to remove default padding
            }}>
            {processedHighlights?.map((highlight: any) => (
              <Grid item key={highlight._id} xs={12} sm={6} md={4}>
                <HighlightsCard 
                  highlight={highlight}
                  onView={() => handleView(highlight._id)} 
                />
              </Grid>
            ))}
            
            {processedHighlights?.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 1
                }}>
                  <Typography>No highlights found for this category.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
        <Box sx={{ 
        overflow: 'hidden',  // Add this
        width: '100%'       // Add this
      }}>
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ 
          width: '100%',
          margin: 0, // Add this
          pl: 0 // Add this to remove default padding
        }}>
            {pressReleasesData?.data.map((pressRelease: PressRelease) => (
              <Grid item key={pressRelease._id} xs={12} sm={6} md={4}>
                <PressReleaseCard 
                  pressRelease={pressRelease}
                  onView={() => handlePressReleaseView(pressRelease._id)}
                />
              </Grid>
            ))}
            
            {pressReleasesData?.data.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 1
                }}>
                  <Typography>No press releases available.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Home;