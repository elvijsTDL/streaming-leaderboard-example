# Theme Configuration Guide

## Overview
The Streaming Leaderboard supports multiple color schemes that can be easily configured through environment variables.

## Available Themes

### 1. Matrix (Default)
- **Primary**: Amber/Gold (#F59E0B)
- **Background**: Black (#000000)
- **Style**: Classic matrix/terminal aesthetic
- **Usage**: `VITE_THEME=matrix`

### 2. Cyber
- **Primary**: Cyan (#00FFFF)
- **Background**: Dark blue-black (#0A0A0A)
- **Style**: Cyberpunk/futuristic aesthetic
- **Usage**: `VITE_THEME=cyber`

### 3. Purple
- **Primary**: Violet (#8B5CF6)
- **Background**: Dark purple (#0F0A1A)
- **Style**: Royal/mystical aesthetic
- **Usage**: `VITE_THEME=purple`

### 4. Green
- **Primary**: Emerald (#10B981)
- **Background**: Dark green (#0A1A0F)
- **Style**: Nature/growth aesthetic
- **Usage**: `VITE_THEME=green`

### 5. Blue
- **Primary**: Blue (#3B82F6)
- **Background**: Dark blue (#0A0F1A)
- **Style**: Professional/corporate aesthetic
- **Usage**: `VITE_THEME=blue`

## Configuration

### Method 1: Environment Variable
Create a `.env` file in your project root:
```bash
VITE_THEME=cyber
```

### Method 2: Environment-specific files
- `.env.local` - Local development
- `.env.production` - Production builds
- `.env.development` - Development builds

## Example .env Configuration
```bash
# Theme Configuration
VITE_THEME=cyber

# Token Configuration
VITE_TOKEN_ADDRESS=0x1c4f69f14cf754333c302246d25a48a13224118a
VITE_TOKEN_SYMBOL=BUTTHOLE

# Other configuration...
VITE_REOWN_PROJECT_ID=your_project_id
```

## Custom Theme Development

### Adding New Themes
1. Open `src/lib/theme.ts`
2. Add your theme to the `themes` object:
```typescript
newtheme: {
  primary: '#YOUR_COLOR',
  primaryHover: '#YOUR_HOVER_COLOR',
  // ... other colors
} as ThemeColors,
```

### Theme Properties
Each theme must include:
- `primary`, `primaryHover`, `primaryDark`
- `secondary`, `secondaryHover`
- `background`, `cardBackground`, `cardBorder`
- `textPrimary`, `textSecondary`, `textMuted`
- `success`, `error`, `warning`
- `buttonBackground`, `buttonHover`
- `linkColor`, `linkHover`

## Preview Themes
1. Set your desired theme in `.env`
2. Restart your development server
3. The app will automatically use the new color scheme

## Production Deployment
Make sure to set the `VITE_THEME` environment variable in your deployment platform (Vercel, Netlify, etc.).

## Troubleshooting
- If theme doesn't change, restart the dev server
- Invalid theme names fall back to 'matrix' theme
- Check browser console for theme-related warnings

