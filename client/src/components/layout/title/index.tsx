import React from 'react';
import { useRouterContext, TitleProps } from '@pankod/refine-core';
import { Button } from '@pankod/refine-mui';

import { kist, kistlogo, logo, logobg, yariga } from 'assets';

export const Title: React.FC<TitleProps> = ({ collapsed }) => {
  const { Link } = useRouterContext();

  return (
    <Button fullWidth variant="text" 
    sx={{
      backgroundColor: 'white',
      height: '80%',
      width: '80%',
      paddingTop: '5px',
    }} 
    disableFocusRipple
    disableRipple>
      <Link to="/">
        {collapsed ? (
          <img src={kistlogo} alt="KIST Park" width="40px" style={{ paddingTop: '8px' }} />
        ) : (
          <img src={kist} alt="KIST Park" width="140px" style={{ paddingTop: '8px' }}/>
        )}
      </Link>
    </Button>
  );
};
