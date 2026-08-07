import React from 'react';
import { Image } from 'react-native';

// High-resolution vector URI for the cute Eilik-style waving robot
export const CUTE_ROBOT_IMAGE_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bodyWhite" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="85%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </radialGradient>
    <linearGradient id="pinkAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9EAA"/>
      <stop offset="100%" stop-color="#FF6B8B"/>
    </linearGradient>
  </defs>

  <!-- Waving Left Arm -->
  <path d="M 28 50 C 18 42 12 30 18 24 C 24 18 30 30 32 45 Z" fill="url(#bodyWhite)"/>
  <path d="M 18 24 C 24 18 28 26 26 34 C 20 32 16 28 18 24 Z" fill="url(#pinkAccent)"/>

  <!-- Waving Right Arm -->
  <path d="M 72 50 C 82 42 88 30 82 24 C 76 18 70 30 68 45 Z" fill="url(#bodyWhite)"/>
  <path d="M 82 24 C 76 18 72 26 74 34 C 80 32 84 28 82 24 Z" fill="url(#pinkAccent)"/>

  <!-- Main Egg Body -->
  <ellipse cx="50" cy="65" rx="22" ry="25" fill="url(#bodyWhite)"/>

  <!-- Pink Collar Bib -->
  <path d="M 38 46 C 38 46 50 60 62 46 C 60 55 40 55 38 46 Z" fill="url(#pinkAccent)"/>

  <!-- Head Sphere -->
  <circle cx="50" cy="32" r="24" fill="url(#bodyWhite)"/>

  <!-- Pink Top Head Patch -->
  <path d="M 38 13 C 44 9 56 9 62 13 C 58 17 42 17 38 13 Z" fill="url(#pinkAccent)"/>

  <!-- Black Face Visor Screen -->
  <ellipse cx="50" cy="33" rx="17" ry="14" fill="#090A0F"/>

  <!-- Cute Happy Eyes (^ ^) -->
  <path d="M 39 31 C 41 27 45 27 47 31" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 53 31 C 55 27 59 27 61 31" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>

  <!-- Cute Mouth (w) -->
  <path d="M 46 36 Q 48 39 50 36 Q 52 39 54 36" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`);

interface CuteRobotIconProps {
  size?: number;
}

export const CuteRobotIcon: React.FC<CuteRobotIconProps> = ({ size = 28 }) => {
  return (
    <Image
      source={{ uri: CUTE_ROBOT_IMAGE_URI }}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  );
};
