import React from 'react';

type StarBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: string;
  thickness?: number;
};

const StarBorder: React.FC<StarBorderProps> = ({
  className = '',
  color = '#8b5cf6',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}) => {
  return (
    <div
      className={`relative inline-block overflow-hidden rounded-xl ${className}`}
      {...rest}
      style={{
        padding: `${thickness}px`,
        ...(rest.style || {}),
      }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default StarBorder;
