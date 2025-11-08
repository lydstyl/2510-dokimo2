# Note Field Integration Guide

This document explains how the `note` field has been added to Landlord, Property, Tenant, and Lease entities, and how to integrate it into your UI.

## What Was Added

### 1. Database Schema
Added optional `note` field (String?) to:
- `Landlord` model
- `Property` model
- `Tenant` model
- `Lease` model

Migration: `20251108142446_add_note_fields`

### 2. Domain Layer
Updated domain entities to include the `note` field:
- `src/domain/entities/Landlord.ts`
- `src/domain/entities/Property.ts`
- `src/domain/entities/Tenant.ts`
- `src/domain/entities/Lease.ts`

Each entity now has:
```typescript
get note(): string | undefined {
  return this.props.note;
}
```

### 3. Infrastructure Layer
Updated Prisma repositories to handle the `note` field in `create()`, `update()`, and `toDomain()` methods:
- `src/infrastructure/repositories/PrismaLandlordRepository.ts`
- `src/infrastructure/repositories/PrismaPropertyRepository.ts`
- `src/infrastructure/repositories/PrismaTenantRepository.ts`
- `src/infrastructure/repositories/PrismaLeaseRepository.ts`

### 4. API Routes
Created PATCH endpoints to update notes:
- `PATCH /api/landlords/[landlordId]/note`
- `PATCH /api/properties/[propertyId]/note`
- `PATCH /api/tenants/[tenantId]/note`
- `PATCH /api/leases/[leaseId]/note`

All endpoints require authentication and verify ownership before allowing updates.

### 5. UI Component
Created a reusable `NoteEditor` component at `src/components/NoteEditor.tsx` with features:
- Markdown editing with live preview
- Toggle between edit and preview modes
- Save/cancel actions
- Empty state with "Add note" button
- Display mode with rendered Markdown
- Support for GitHub Flavored Markdown (GFM)

### 6. Translations
Added French translations in `messages/fr.json`:
```json
{
  "common": {
    "note": "Note",
    "notes": "Notes",
    "addNote": "Ajouter une note",
    "editNote": "Modifier la note",
    "noNote": "Aucune note",
    "markdownSupported": "Markdown supporté"
  }
}
```

## How to Integrate in Your Pages

### Step 1: Import the Component

```typescript
import { NoteEditor } from '@/components/NoteEditor';
```

### Step 2: Add State for the Note

```typescript
const [note, setNote] = useState<string | undefined>(initialNote);
```

### Step 3: Create the Save Handler

```typescript
const handleSaveNote = async (newNote: string) => {
  const response = await fetch(`/api/landlords/${landlordId}/note`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: newNote }),
  });

  if (!response.ok) {
    throw new Error('Failed to save note');
  }

  const data = await response.json();
  setNote(data.note);
};
```

### Step 4: Add the Component to Your JSX

```tsx
<NoteEditor
  note={note}
  onSave={handleSaveNote}
  entityType="landlord" // or "property", "tenant", "lease"
/>
```

## Full Example: Landlord Details Page

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { NoteEditor } from '@/components/NoteEditor';

export default function LandlordDetailsPage() {
  const params = useParams();
  const landlordId = params.landlordId as string;
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandlord();
  }, [landlordId]);

  const fetchLandlord = async () => {
    const response = await fetch(`/api/landlords/${landlordId}`);
    const data = await response.json();
    setLandlord(data);
    setLoading(false);
  };

  const handleSaveNote = async (newNote: string) => {
    const response = await fetch(`/api/landlords/${landlordId}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    });

    if (!response.ok) {
      throw new Error('Failed to save note');
    }

    const data = await response.json();
    setLandlord({ ...landlord, note: data.note });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>{landlord.name}</h1>

      {/* Other landlord details here */}

      <NoteEditor
        note={landlord.note}
        onSave={handleSaveNote}
        entityType="landlord"
      />
    </div>
  );
}
```

## Markdown Features Supported

The `NoteEditor` uses `react-markdown` with `remark-gfm` plugin, supporting:

- **Headers**: `## Titre`
- **Bold**: `**texte en gras**`
- **Italic**: `*texte en italique*`
- **Lists**:
  ```
  - Point 1
  - Point 2
  ```
- **Numbered lists**:
  ```
  1. Premier
  2. Deuxième
  ```
- **Links**: `[texte](https://example.com)`
- **Code blocks**:
  ````
  ```
  code here
  ```
  ````
- **Tables** (GFM)
- **Strikethrough**: `~~texte barré~~` (GFM)
- **Task lists**: `- [ ] Tâche` (GFM)

## API Endpoint Details

### Request Format

```typescript
PATCH /api/{entity-type}/{entityId}/note
Content-Type: application/json

{
  "note": "## Important\n- Point 1\n- Point 2"
}
```

### Response Format

```typescript
{
  "note": "## Important\n- Point 1\n- Point 2"
}
```

### Error Responses

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't own the entity
- `404 Not Found`: Entity doesn't exist
- `500 Internal Server Error`: Database or server error

## Where to Add Notes

The note field is now available on:

1. **Landlord pages**: Add notes about a landlord's preferences, important dates, etc.
2. **Property pages**: Add notes about property specifics, maintenance needs, etc.
3. **Tenant pages**: Add notes about tenant history, special arrangements, etc.
4. **Lease pages**: Add notes about lease terms, important clauses, etc.

## Tips

1. **Placement**: Add the `NoteEditor` at the bottom of detail pages or in a dedicated "Notes" section
2. **Loading states**: Handle loading and error states in your `onSave` handler
3. **Refresh data**: After saving, update local state or refetch data to show the saved note
4. **Security**: API routes already verify ownership - no additional security needed in UI

## Next Steps

To integrate notes into existing pages:

1. Find the page file (e.g., `src/app/dashboard/landlords/page.tsx`)
2. Add the `NoteEditor` component
3. Implement the save handler using the appropriate API endpoint
4. Test the integration

The note field is fully functional and ready to use in your application!
