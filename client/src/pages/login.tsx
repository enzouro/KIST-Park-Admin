import { useEffect, useRef } from 'react';
import { useLogin } from '@pankod/refine-core';
import { Container, Box } from '@pankod/refine-mui';
import axios from 'axios'; // Import axios for API requests
import { CredentialResponse } from 'interfaces/google';
import {kist} from '../assets';

const GoogleButton: React.FC<{ onLogin: (res: CredentialResponse) => void }> = ({ onLogin }) => {
  const divRef = useRef<HTMLDivElement>(null);

  // In the useEffect:
  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !divRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        ux_mode: 'popup',
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        redirect_uri:'urn:ietf:wg:oauth:2.0:oob',
        callback: async (res: CredentialResponse) => {
          if (res.credential) {
            const profileObj = JSON.parse(atob(res.credential.split('.')[1]));
            const response = await axios.post(`http://localhost:8080/api/v1/users`, {
              name: profileObj.name,
              email: profileObj.email,
              avatar: profileObj.picture,
            });

            if (response.data.isAllowed) {
              onLogin(res);
            } else {
              // Redirect to Unauthorized page
              window.location.href = '/unauthorized';
            }
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'filled_blue',
        size: 'medium',
        type: 'standard',
      });
    } catch (error) {
      console.log(error);
    }
  }, [onLogin]);

  return <div ref={divRef} />;
};

export const Login: React.FC = () => {
  const { mutate: login } = useLogin();

  return (
    <Box component="div" sx={{ background: 'linear-gradient(0deg, rgba(255,255,255,1) 32%, rgba(140,181,219,1) 84%, rgba(98,155,206,1) 100%, rgba(53,126,191,1) 100%);' }}>
      <Container component="main" maxWidth="xs" sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100vh',
      }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        >
          <Box>
            <img src={kist} alt="KIST Park Logo" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  objectFit: 'contain' 
                }}  />
          </Box>
          
          <Box mt={4}>
            <GoogleButton onLogin={login} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
