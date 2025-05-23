import { Button } from '@pankod/refine-mui';

import { CustomButtonProps } from 'interfaces/common';

const CustomButton = ({ type, title, backgroundColor, color, fullWidth, icon, handleClick, disabled }: CustomButtonProps) => {
  if (type === 'submit') {
    return (
      <Button
        type={type}
        sx={{
          flex: fullWidth ? 1 : 'unset',
          padding: '10px 15px',
          width: fullWidth ? '100%' : 'fit-content',
          minWidth: 130,
          height: { xs: '32px', sm: 'auto' },
          backgroundColor,
          color,
          fontSize: 16,
          fontWeight: 600,
          gap: '10px',
          textTransform: 'capitalize',
          
          '&:hover': {
            opacity: 0.9,
            backgroundColor,
          },
        }}
        onClick={handleClick}
      >
        {icon}
        {title}
      </Button>
    );
  }

  return (
    <Button
      disabled={disabled}
      sx={{
        flex: fullWidth ? 1 : 'unset',
        padding: '10px 15px',
        width: fullWidth ? '100%' : 'fit-content',
        minWidth: 130,
        backgroundColor,
        color,
        fontSize: 16,
        fontWeight: 600,
        gap: '10px',
        textTransform: 'capitalize',
        '&:hover': {
          opacity: 0.9,
          backgroundColor,
        },
      }}
      onClick={handleClick}
    >
      {icon}
      {title}
    </Button>
  );
};

export default CustomButton;
