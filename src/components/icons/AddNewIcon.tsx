import React from 'react';

type AddNewIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const AddNewIcon: React.FC<AddNewIconProps> = ({
  size = 24,
  className = '',
  ...rest
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M9 12H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
};

export default AddNewIcon;