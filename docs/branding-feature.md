# Branding Feature Specification

This document outlines the implementation plan for allowing restaurants to customize their guest-facing event pages with their own logo and header image.

---

## Overview

Restaurants can upload:
- **Logo** (SVG, PNG, or JPG) - displayed on the hero banner
- **Header Image** (JPG/PNG) - banner at the top of the guest page

Images are stored in Cloudinary. The guest page displays branding if available, or shows a clean unbranded version if not.

---

## Database Changes

Add two columns to `app_user` table:

```sql
ALTER TABLE app_user
ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN hero_image_url VARCHAR(500) DEFAULT NULL;
```

---

## Backend API

### GET /api/branding
Returns current branding for authenticated user.

**Response:**
```json
{
  "return_code": "SUCCESS",
  "branding": {
    "logo_url": "https://res.cloudinary.com/.../logo.svg",
    "hero_image_url": "https://res.cloudinary.com/.../hero.jpg"
  }
}
```

### PUT /api/branding
Updates branding URLs after successful Cloudinary upload.

**Request:**
```json
{
  "logo_url": "https://res.cloudinary.com/.../logo.svg",
  "hero_image_url": "https://res.cloudinary.com/.../hero.jpg"
}
```
Either field can be null to clear it.

### DELETE /api/branding/logo
Removes logo (sets to null). Optionally deletes from Cloudinary.

### DELETE /api/branding/hero
Removes hero image (sets to null). Optionally deletes from Cloudinary.

### Update: GET /api/events/public/:link_token
Include branding in response:

```json
{
  "return_code": "SUCCESS",
  "event": { ... },
  "guests": [ ... ],
  "is_owner": false,
  "branding": {
    "logo_url": "https://...",
    "hero_image_url": "https://..."
  }
}
```

---

## Cloudinary Integration

### Approach: Direct Upload with Signed Requests

1. Frontend requests a signature from backend
2. Frontend uploads directly to Cloudinary with signature
3. Cloudinary returns the URL
4. Frontend sends URL to our API to save

### Environment Variables

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Backend Endpoint: POST /api/cloudinary/signature

Generates a signed upload request for secure uploads.

**Request:**
```json
{
  "upload_type": "logo" | "hero"
}
```

**Response:**
```json
{
  "return_code": "SUCCESS",
  "signature": "...",
  "timestamp": 1234567890,
  "cloud_name": "...",
  "api_key": "...",
  "folder": "groupbook/user_123"
}
```

### Upload Presets / Transformations

**Logo:**
- Max dimensions: 200x200
- Allowed formats: SVG, PNG, JPG
- Max file size: 500KB

**Hero Image:**
- Target dimensions: 1200x400 (crop to fit)
- Allowed formats: JPG, PNG
- Max file size: 2MB
- Apply automatic quality optimization

---

## Frontend: Branding Settings Page

### Route: `/dashboard/branding`

### UI Components

1. **Logo Section**
   - Current logo preview (or placeholder)
   - Upload button
   - Remove button (if logo exists)
   - Accepts: SVG, PNG, JPG
   - Shows upload progress
   - Client-side validation: max 500KB

2. **Header Image Section**
   - Current image preview (or placeholder)
   - Upload button with **crop modal**
   - Remove button (if image exists)
   - Accepts: JPG, PNG
   - Shows upload progress
   - Client-side validation: max 2MB before crop

3. **Crop Modal for Header Image**
   - Use library: `react-image-crop` or `react-easy-crop`
   - Fixed aspect ratio: 3:1 (e.g., 1200x400)
   - User can pan/zoom to select crop area
   - Preview of cropped result
   - Confirm/Cancel buttons
   - After confirm, upload cropped image to Cloudinary

### Validation Rules

| Field | Formats | Max Size | Dimensions |
|-------|---------|----------|------------|
| Logo | SVG, PNG, JPG | 500KB | Max 200x200 (display size) |
| Hero | JPG, PNG | 2MB (pre-crop) | Cropped to 1200x400 |

### Error Handling
- File too large
- Invalid format
- Upload failed
- Network error

---

## Frontend: Guest Page Updates

### Changes to `/event/[link_token]/page.tsx`

1. Remove hardcoded `DEMO_BRANDING` constant
2. Get branding from API response: `result.data.branding`
3. Conditionally render:
   - If `branding.hero_image_url` exists: show hero banner
   - If `branding.logo_url` exists: show logo on banner
   - If neither exists: show original plain header

### Fallback Behavior
```tsx
const hasBranding = branding?.hero_image_url || branding?.logo_url;

if (hasBranding) {
  // Render branded version with hero/logo
} else {
  // Render plain version (current original design)
}
```

---

## Implementation Order

### Phase 1: Backend (1-2 hours)
1. Database migration - add columns
2. Create GET/PUT /api/branding endpoints
3. Create DELETE endpoints for logo/hero
4. Update getPublicEvent to include branding
5. Create POST /api/cloudinary/signature endpoint

### Phase 2: Cloudinary Setup (30 mins)
1. Add env vars to server
2. Install cloudinary npm package
3. Test signature generation

### Phase 3: Frontend - Branding Page (2-3 hours)
1. Create `/dashboard/branding` page
2. Add link to dashboard navigation
3. Implement logo upload with preview
4. Implement hero upload with crop modal
5. Implement remove functionality
6. Add loading/error states

### Phase 4: Frontend - Guest Page (30 mins)
1. Update API types to include branding
2. Update guest page to use branding from API
3. Remove demo branding code
4. Test with/without branding

### Phase 5: Cleanup (30 mins)
1. Remove demo branding files from public folder
2. Remove nags-sample folder
3. Test end-to-end
4. Build verification

---

## Dependencies to Install

**Backend:**
```bash
npm install cloudinary
```

**Frontend:**
```bash
npm install react-easy-crop
```

---

## Testing Checklist

- [ ] Upload logo (SVG)
- [ ] Upload logo (PNG)
- [ ] Upload logo (JPG)
- [ ] Upload oversized logo (should reject)
- [ ] Upload hero image and crop
- [ ] Upload oversized hero (should reject)
- [ ] Remove logo
- [ ] Remove hero image
- [ ] View guest page with full branding
- [ ] View guest page with logo only
- [ ] View guest page with hero only
- [ ] View guest page with no branding
- [ ] Mobile responsive check

---

## Notes

- Cloudinary free tier: 25GB storage, 25GB bandwidth/month - sufficient for MVP
- Consider adding image optimization transforms in Cloudinary for performance
- Future enhancement: allow primary color customization
