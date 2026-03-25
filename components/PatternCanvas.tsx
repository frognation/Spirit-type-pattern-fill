'use client';

import { RefObject } from 'react';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  bg: string;
}

export default function PatternCanvas({ canvasRef, width, height, bg }: Props) {
  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-2xl"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${width}/${height}`,
        background: bg,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
