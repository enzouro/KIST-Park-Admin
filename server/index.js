import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './mongodb/connect.js';
import userRouter from './routes/user.routes.js';
import userManagementRoutes from './routes/userManagement.routes.js';
import highlightsRoutes from './routes/highlights.routes.js';
import categoryRouter from './routes/category.routes.js';
import pressReleaseRouter from './routes/press-release.routes.js';
import highlightsWebRoutes from './routes/highlights-web.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to KIST Park Admin!',
  });
});

app.use('/api/v1/users', userRouter);

app.use('/api/v1/user-management', userManagementRoutes);
app.use('/api/v1/highlights', highlightsRoutes);
app.use('/api/v1/categories', categoryRouter);

app.use('/api/v1/press-release', pressReleaseRouter);

app.use('/api/v1/highlights-web', highlightsWebRoutes);


const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL);
    app.listen(8080, () => console.log('Server started on port 8080'));
  } catch (error) {
    console.log(error);
  }
};

startServer();
