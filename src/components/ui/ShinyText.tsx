import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 3,
  className = '',
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] ${
        disabled ? '' : 'animate-shiny-text'
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, #71717a 0%, #71717a 35%, #ffffff 50%, #71717a 65%, #71717a 100%)',
        backgroundSize: '200% auto',
        animationDuration,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
