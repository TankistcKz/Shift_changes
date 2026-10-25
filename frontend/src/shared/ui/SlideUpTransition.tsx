import { forwardRef } from 'react';
import type { ReactElement, Ref } from 'react';
import Slide from '@mui/material/Slide';
import type { TransitionProps } from '@mui/material/transitions';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default SlideUpTransition;
