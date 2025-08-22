// Central color palette configuration
export const colorPalette = {
  // Primary bonsai-inspired colors
  washedWhite: '#FAF9F6',
  stoneGray: '#D4D0C6',
  stoneGrayLight: '#E8E6E1',
  deepCharcoal: '#2C2C2C',
  charcoalSoft: '#4A4A4A',
  mossGreen: '#6E7C60',
  mossGreenLight: '#8A9B7A',
  clayRed: '#A05C4E',
  clayRedSoft: '#B87265',
  woodBrown: '#8B6C42',
  woodBrownLight: '#A08156',
} as const;

// CSS variable names mapping
export const cssVariableMap = {
  washedWhite: '--washed-white',
  stoneGray: '--stone-gray',
  stoneGrayLight: '--stone-gray-light',
  deepCharcoal: '--deep-charcoal',
  charcoalSoft: '--charcoal-soft',
  mossGreen: '--moss-green',
  mossGreenLight: '--moss-green-light',
  clayRed: '--clay-red',
  clayRedSoft: '--clay-red-soft',
  woodBrown: '--wood-brown',
  woodBrownLight: '--wood-brown-light',
} as const;

// Three.js color mapping
export const threeJsColorMap = {
  LIGHT_VEC3_RGB: 'washedWhite',
  MID_VEC3_RGB: 'mossGreen',
  OFF_BLACK_VEC3_RGB: 'charcoalSoft',
  BLACK_VEC3_RGB: 'deepCharcoal',
  STONE_GRAY_VEC3_RGB: 'stoneGray',
  CLAY_RED_VEC3_RGB: 'clayRed',
  WOOD_BROWN_VEC3_RGB: 'woodBrown',
} as const; 