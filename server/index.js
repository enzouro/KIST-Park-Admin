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
import pressReleaseWebRoutes from './routes/pressRelease-web.routes.js';
import subscribersRouter from './routes/subscribers.routes.js';

import auth from './middleware/auth.middleware.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000','http://localhost:4000', 'https://kist-park-admin.netlify.app','http://127.0.0.1:4000','https://firstkistpark.com'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to KIST Park Admin!',
  });
});

// Add this before your other routes
app.get('/api/v1/test-auth', auth, (req, res) => {
  res.json({ 
      message: 'Authentication working', 
      user: req.user 
  });
});


app.use('/api/v1/users', userRouter);

app.use('/api/v1/user-management', auth, userManagementRoutes);
app.use('/api/v1/highlights', auth, highlightsRoutes);
app.use('/api/v1/categories', auth, categoryRouter);
app.use('/api/v1/press-release', auth, pressReleaseRouter);

app.use('/api/v1/highlights-web', highlightsWebRoutes);
app.use('/api/v1/press-release-web', pressReleaseWebRoutes);

app.use('/api/v1/subscribers', subscribersRouter);

const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL);
    app.listen(8080);
  } catch (error) {
    console.log(error);
  }
};

startServer();
