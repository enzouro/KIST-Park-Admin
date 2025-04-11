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
  Paper
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
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Home = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate(); // Initialize useNavigate

  
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleView = (id: string) => {
    navigate(`/highlights/show/${id}`); // Redirect to the preview page
  };

  if (isLoading) {
    return <Box sx={{ p: 2 }}>Loading...</Box>;
  }


  return (
    <Box>
      <Typography 
        fontSize={25} 
        fontWeight={700} 
        sx={{ mb: 3 }}
      >
        Dashboard
      </Typography>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ 
              px: 2,
              '& .MuiTab-root': { 
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab label="Highlights" />
            <Tab label="Press Releases" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>

          {/* Category Filter */}
          <Box sx={{ mb: 2 }}>
            <TextField
              select
              size="small"
              label="Filter by Category"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categoriesData?.data.map((category: any) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.category}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        <Grid container spacing={3}>
          {processedHighlights?.map((highlight: any) => (
            <Grid item key={highlight._id} xs={12} sm={6} md={4}>
              <HighlightsCard 
              highlight={highlight}
              onView={() => handleView(highlight._id)} />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {pressReleasesData?.data.map((pressRelease: PressRelease) => (
            <Grid item key={pressRelease._id} xs={12} sm={6} md={4}>
              <PressReleaseCard 
                pressRelease={pressRelease}
                onView={() => handlePressReleaseView(pressRelease._id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
      </Paper>
    </Box>
  );
};

export default Home;