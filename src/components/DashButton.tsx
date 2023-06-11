import React from 'react';
import { MouseEventHandler, ReactElement } from 'react';
import { Button } from 'react95';

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactElement;
}
const DashButton = ({ handleClick, children }: Props) => {
  return (
    <Button
      className="border-dashed border-2 border-black rounded-lg py-2 px-4 text-black hover:bg-black hover:text-white transition-all duration-300 ease-in-out"
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

export { DashButton };
