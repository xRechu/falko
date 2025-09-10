'use client';

import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MangaExperience } from "./MangaExperience";
import { MangaUI } from "./MangaUI";

interface MangaViewerProps {
  chapterNumber: number;
  chapterTitle: string;
  pages: Array<{
    front: string;
    back: string;
  }>;
}

export const MangaViewer = ({ chapterNumber, chapterTitle, pages }: MangaViewerProps) => {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 overflow-hidden">
      <MangaUI 
        pages={pages} 
        chapterTitle={chapterTitle}
        chapterNumber={chapterNumber}
      />
      
      <Loader />
      
      {/* Canvas with proper spacing for header */}
      <div className="absolute inset-0 pt-20">
        <Canvas 
          shadows 
          camera={{
            position: [-0.5, 0.2, typeof window !== 'undefined' && window.innerWidth > 800 ? 4 : 9],
            fov: 45,
          }}
          className="w-full h-full"
        >
          <group position-y={-0.2}>
            <Suspense fallback={null}>
              <MangaExperience pages={pages} />
            </Suspense>
          </group>
        </Canvas>
      </div>
    </div>
  );
};