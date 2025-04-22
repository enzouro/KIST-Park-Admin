import {
  Article,
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

const App = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Add a function to check user authorization
  const checkUserAuthorization = async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return;
      
      const parsedUser = JSON.parse(user);
      const response = await fetch(`http://localhost:8080/api/v1/users/${parsedUser.userid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        // If user is not found or unauthorized, trigger logout
        authProvider.logout({} as any);  // Provide empty object as parameter
        window.location.href = '/unauthorized';
      }

      const userData = await response.json();
      if (!userData.isAllowed) {
        // If user is explicitly not allowed, trigger logout
        authProvider.logout({} as any);  // Provide empty object as parameter
        window.location.href = '/unauthorized';
      }
    } catch (error) {
      console.error('Error checking user authorization:', error);
    }
  };

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user); // Safe to parse as user is not null
      if (parsedUser.isAdmin) {
        setIsAdmin(parsedUser.isAdmin);
      }
    }
    
    // Set up periodic authorization check
    const authCheckInterval = setInterval(checkUserAuthorization, 30000); // Check every 30 seconds
    
    // Initial check
    checkUserAuthorization();
    

    // Cleanup interval on component unmount
    return () => clearInterval(authCheckInterval);
  }, []);

  const authProvider: AuthProvider = {
    login: async ({ credential }: CredentialResponse) => {
      const profileObj = credential ? parseJwt(credential) : null;

      // Save user to MongoDB
      if (profileObj) {
        const response = await fetch('http://localhost:8080/api/v1/users', {
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
            // Prevent login if user is not allowed
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

      return Promise.resolve();
    },
    checkError: () => Promise.resolve(),
    checkAuth: async () => {
      const token = localStorage.getItem('token');

      if (token) {
        return Promise.resolve();
      }
      return Promise.reject();
    },

    getPermissions: () => Promise.resolve(),
    getUserIdentity: async () => {
      const user = localStorage.getItem('user');
      if (user) {
        return Promise.resolve(JSON.parse(user));
      }
    },
  };
  

  

  return (
    <ColorModeContextProvider>
      <CssBaseline />
      <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
      <RefineSnackbarProvider>
        <Refine
          dataProvider={dataProvider('http://localhost:8080/api/v1', axiosInstance)}
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
          routerProvider={{
            ...routerProvider,
            routes: [
              {
                path: '/unauthorized',
                element: <UnauthorizedPage />
              },
            ]

          }}
          authProvider={authProvider}
          LoginPage={Login}
          DashboardPage={Home}
        />
      </RefineSnackbarProvider>
    </ColorModeContextProvider>
  );
};

export default App;

