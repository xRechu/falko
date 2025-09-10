'use client';

import { Environment, Float, OrbitControls } from "@react-three/drei";
import { MangaBook3D } from "./MangaBook3D";
import { useAtom } from "jotai";
import { floatEnabledAtom } from "./MangaUI";

interface MangaExperienceProps {
  pages: Array<{
    front: string;
    back: string;
  }>;
}

export const MangaExperience = ({ pages }: MangaExperienceProps) => {
  const [floatEnabled] = useAtom(floatEnabledAtom);
  
  const BookComponent = () => <MangaBook3D pages={pages} />;
  
  return (
    <>
      {floatEnabled ? (
        <Float
          rotation-x={-Math.PI / 4}
          floatIntensity={1}
          speed={2}
          rotationIntensity={2}
        >
          <BookComponent />
        </Float>
      ) : (
        <group rotation-x={-Math.PI / 4}>
          <BookComponent />
        </group>
      )}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        maxDistance={10}
        minDistance={2}
      />
      
      <Environment preset="studio" />
      
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};