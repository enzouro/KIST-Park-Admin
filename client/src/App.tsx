import {
  Article,
  Email,
  ManageAccounts,
  Star,
  VillaOutlined,
} from '@mui/icons-material';
import { AuthProvider, Refine } from '@pankod/refine-core';
import {
  CssBaseline,
  ErrorComponent,
  GlobalStyles,
  notificationProvider,
  ReadyPage,
  RefineSnackbarProvider,
} from '@pankod/refine-mui';
import routerProvider from '@pankod/refine-react-router-v6';
import dataProvider from '@pankod/refine-simple-rest';
import axios, { AxiosRequestConfig } from 'axios';

import { Header, Layout, Sider, Title } from 'components/layout';
import { ColorModeContextProvider } from 'contexts';
import { CredentialResponse } from 'interfaces/google';
import { parseJwt } from 'utils/parse-jwt';

import {
  Home,
  Login,
  AllHighlights,
  AllPressReleases,
  EditPressRelease,
  PressReleasePreview,
  CreateHighlights,
  EditHighlights,
  HighlightsPreview,
} from 'pages';
import React from 'react';
import UserManagement from 'pages/user-management';
import { UnauthorizedPage } from 'pages/unauthorized';
import CreatePressRelease from 'pages/create-pressrelease';
import { SessionExpired } from 'pages/session-expired';
import Subscribers from 'pages/subscribers';


interface Config{
  apiUrl: string | undefined;
}

// Define the basename once to use it throughout the application
const BASENAME = '/kistadmin';

const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080' // Provide a fallback URL
}

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((request: AxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (request.headers) {
      request.headers['Authorization'] = `Bearer ${token}`;
    } else {
      request.headers = {
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return request;
});
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear the expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Let Refine handle the redirect
        return Promise.reject(error);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to build paths with the basename
const buildPath = (path: string): string => {
  return `${BASENAME}${path}`;
};

const App = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Consolidated authorization and token check function
  const checkAuthAndTokenValidity = async () => {
    try {
      // 1. First check if token exists
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // 2. Check if token is expired or needs renewal
      try {
        const decodedToken = parseJwt(token);
        const currentTime = Date.now() / 1000;
        
        // If token is expired, log out automatically
        if (decodedToken.exp < currentTime) {
          console.log("Token expired, logging out user");
          authProvider.logout({} as any);
          window.location.href = buildPath('/session-expired');
          return; // Exit early if token is expired
        }
      } catch (error) {
        authProvider.logout({} as any);
        window.location.href = buildPath('/login');
        return; // Exit early if token parsing fails
      }
      
      // 3. Now check user authorization with the server
      const user = localStorage.getItem('user');
      if (!user) return;
      
      const parsedUser = JSON.parse(user);
      const response = await fetch(`${config.apiUrl}/api/v1/users/${parsedUser.userid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // If user is not found or unauthorized, trigger logout
        authProvider.logout({} as any);
        window.location.href = buildPath('/unauthorized');
        return;
      }
  
      const userData = await response.json();
      if (!userData.isAllowed) {
        // If user is explicitly not allowed, trigger logout
        authProvider.logout({} as any);
        window.location.href = buildPath('/unauthorized');
        return;
      }
      
      // User is authenticated and authorized - no action needed
    } catch (error) {
      console.error('Error checking authentication and authorization:', error);
    }
  };

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      if (parsedUser.isAdmin) {
        setIsAdmin(parsedUser.isAdmin);
      }
    }
    
    // Set up a single consolidated check
    const authCheckInterval = setInterval(checkAuthAndTokenValidity, 60000); // Check every minute
    
    // Initial check
    checkAuthAndTokenValidity();
    
    // Cleanup interval on component unmount
    return () => clearInterval(authCheckInterval);
  }, []);


  const authProvider: AuthProvider = {
    login: async ({ credential }: CredentialResponse) => {
      const profileObj = credential ? parseJwt(credential) : null;

      // Save user to MongoDB
      if (profileObj) {
        const response = await fetch(`${config.apiUrl}/api/v1/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profileObj.name,
            email: profileObj.email,
            avatar: profileObj.picture,
          }),
        });

        const data = await response.json();

         if (response.status === 200) {
          if (!data.isAllowed) {
            // Redirect to unauthorized page for not allowed users
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = buildPath('/unauthorized');
            return Promise.reject(new Error('User is not allowed to access the system'));
          }
          
          localStorage.setItem(
            'user',
            JSON.stringify({
              ...profileObj,
              avatar: profileObj.picture,
              userid: data._id,
              isAdmin: data.isAdmin,
            }),
          );
          setIsAdmin(data.isAdmin); // Set isAdmin after login
        } else {
          // Use Refine's navigation system - no direct redirects
          return Promise.reject();
        }
      }

      localStorage.setItem('token', `${credential}`);
      return Promise.resolve();
    },
    logout: () => {
      const token = localStorage.getItem('token');

      if (token && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        axios.defaults.headers.common = {};
        window.google?.accounts.id.revoke(token, () => Promise.resolve());
      }

      // Let Refine handle the redirect to login
      return Promise.resolve();
    },
    checkError: (error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    checkAuth: async () => {
      const token = localStorage.getItem('token');
    
      if (!token) {
        // Don't redirect here - let Refine handle the redirect to login
        return Promise.reject();
      }
    
      // Check if token is expired
      try {
        const decodedToken = parseJwt(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired, clear storage but don't redirect here
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Use Refine's navigation to handle this correctly
          return Promise.reject(new Error('Token expired'));
        }
        
        return Promise.resolve();
      } catch (error) {
        // Token parse error, don't redirect here
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }
    },

    getPermissions: () => Promise.resolve(),
    getUserIdentity: async () => {
      const user = localStorage.getItem('user');
      if (user) {
        return Promise.resolve(JSON.parse(user));
      }
    },
  };
  
  // Configure router provider properly
  const customRouterProvider = {
    ...routerProvider,
    RouterComponent: (props: any) => {
      const OriginalRouterComponent = routerProvider.RouterComponent;
      return <OriginalRouterComponent basename={BASENAME} {...props} />;
    },
    // Let Refine handle these routes
    routes: [
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />
      },
      {
        path: '/session-expired',
        element: <SessionExpired />
      }
    ]
  };

  return (
    <ColorModeContextProvider>
      <CssBaseline />
      <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
      <RefineSnackbarProvider>
        <Refine
          dataProvider={dataProvider(`${config.apiUrl}/api/v1`, axiosInstance)}
          notificationProvider={notificationProvider}
          ReadyPage={ReadyPage}
          catchAll={<ErrorComponent />}
          resources={[
            {
              name: 'highlights',
              list: AllHighlights,
              show: HighlightsPreview,
              create: CreateHighlights,
              edit: EditHighlights,
              icon: <Star />,
            },
            {
              name: 'press-release',
              list: AllPressReleases,
              create: CreatePressRelease,
              edit: EditPressRelease,
              show: PressReleasePreview,
              icon: <Article />,
            },
            {
              name:'subscribers',
              list: Subscribers,
              icon: <Email />,
            },
            // Admin-only resource
            ...(isAdmin ? [{
              name: 'user-management',
              list: UserManagement,
              icon: <ManageAccounts />,
            }] : []),
          ]}
          Title={Title}
          Sider={Sider}
          Layout={Layout}
          Header={Header}
          routerProvider={customRouterProvider}
          authProvider={authProvider}
          LoginPage={Login}
          DashboardPage={Home}
        />
      </RefineSnackbarProvider>
    </ColorModeContextProvider>
  );
};

export default App;