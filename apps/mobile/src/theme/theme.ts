import { designTokens } from '@findaspring/design-tokens';

export const theme = {
  color: designTokens.color,
  space: designTokens.space,
  radius: designTokens.radius,
  type: designTokens.type
};

export type Theme = typeof theme;
