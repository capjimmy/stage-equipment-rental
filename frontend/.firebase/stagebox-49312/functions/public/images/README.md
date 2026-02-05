# Placeholder Image System

This directory contains placeholder SVG images for the Stage Equipment Rental application.

## Available Placeholder Images

### Product Placeholders
- `product-1.svg` - Violet placeholder (#8B5CF6)
- `product-2.svg` - Pink placeholder (#EC4899)
- `product-3.svg` - Blue placeholder (#3B82F6)
- `product-4.svg` - Green placeholder (#10B981)
- `product-5.svg` - Orange placeholder (#F59E0B)

### General Placeholders
- `placeholder.svg` - Gray placeholder (#94A3B8) - Used for missing product images
- `placeholder-violet.svg` - Violet placeholder (#8B5CF6) - Used for image loading errors

## Usage

All images in the application use regular `<img>` tags with fallback handling:

```tsx
<img
  src={imageUrl}
  alt="Product Image"
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = '/images/placeholder.svg';
  }}
/>
```

## Why SVG Placeholders?

1. **No External Dependencies**: Self-contained SVG files work without image optimization
2. **Scalable**: SVGs scale perfectly at any resolution
3. **Lightweight**: Small file size (<1KB each)
4. **No Build Issues**: Works without Next.js Image optimization
5. **Instant Loading**: No network requests needed

## Fallback Strategy

1. **Primary**: Display actual product image
2. **Fallback**: If image fails to load, display appropriate placeholder
3. **No Image**: If no image URL exists, show icon placeholder (Package icon)

## Implementation Details

- All Next.js `<Image>` components have been replaced with standard `<img>` tags
- Each image has an `onError` handler for graceful degradation
- Placeholders are stored in `/public/images/` for direct access
- Color-coded placeholders help identify different product categories during development
