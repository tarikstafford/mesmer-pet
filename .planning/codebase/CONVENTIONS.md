# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `PetCard.tsx`, `ChatInterface.tsx`)
- Library/utility files: camelCase (e.g., `genetics.ts`, `auth.ts`, `backgroundJobs.ts`)
- API routes: kebab-case directories with `route.ts` (e.g., `/app/api/auth/login/route.ts`)
- Validation files: camelCase (e.g., `auth.ts` in `/lib/validations/`)
- Schema/config files: camelCase (e.g., `petModelConfig.ts`, `skillPrompts.ts`)

**Functions:**
- camelCase for all functions: `generateRandomPersonality()`, `verifyPassword()`, `assignRandomTraits()`
- Exported utility functions as named exports: `export function hashPassword()`
- Async functions clearly prefixed or named with async intent: `export async function assignRandomTraits()`

**Variables:**
- camelCase for all variables and constants: `testEmail`, `passwordSchema`, `RARITY_DISTRIBUTION`
- UPPERCASE for constant objects: `RARITY_DISTRIBUTION`, `JWT_SECRET`
- Prefixes for state: `is*` for booleans (e.g., `isValidPassword`, `isCritical`)
- Temporary variables in tests: timestamp-based names (e.g., `test-${Date.now()}@example.com`)

**Types:**
- PascalCase for all TypeScript interfaces and types
- Props interfaces suffixed with `Props`: `PetCardProps`, `PetTrait`, `PetWarning`
- Imported types: `type` keyword for type imports (e.g., `type AxeViolation`)

## Code Style

**Formatting:**
- No formatter configured (Prettier or Biome not detected)
- Consistent indentation: 2 spaces (observed across all files)
- Single quotes for strings in TypeScript, double quotes in JSX attributes
- Trailing commas in objects and arrays (modern style)
- No semicolons enforced, but present in most files (Next.js convention)

**Linting:**
- ESLint with Next.js core-web-vitals configuration
- Config: `.eslintrc.json` extends `next/core-web-vitals`
- Minimal rules - relies on Next.js defaults for code quality

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party)
2. Relative imports from `@/` alias path
3. Specific imports before wildcard imports
4. No blank lines typically between grouped imports

**Examples:**
```typescript
// Top-level external imports
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Then relative path imports
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'

// React imports
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Component imports
const PetModel3D = dynamic(() => import('@/components/PetModel3D'), { ssr: false })
```

**Path Aliases:**
- Primary alias: `@/*` → `./src/*` (configured in `tsconfig.json`)
- Used throughout codebase for cleaner relative imports
- Preferred over `../../../` style paths

## Error Handling

**Patterns:**
- Try-catch blocks in all API routes (`src/app/api/**/*.ts`)
- Generic catch-all error handlers that return 500 status with descriptive message
- `console.error()` for logging before returning error response
- Validation errors parsed from Zod `safeParse()` with detailed issue information
- Next.js API responses using `NextResponse.json()` with explicit status codes

**Examples:**
```typescript
// API route pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Business logic
    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Logging

**Framework:** `console` object (native)

**Patterns:**
- `console.error()` used exclusively for error logging
- Error context included in message: `console.error('Login error:', error)`
- No structured logging or log levels beyond console methods
- Error logging occurs in catch blocks before returning error response

**Examples from codebase:**
- `console.error('Login error:', error)`
- `console.error('Account deletion error:', error)`
- `console.error('Error updating tutorial:', error)`

## Comments

**When to Comment:**
- Function-level JSDoc comments for public/exported functions
- Inline comments for non-obvious logic or validation rules
- Comments referencing user story numbers (e.g., `// US-030: COPPA compliance`)
- Comments explaining why, not what (e.g., "Generate new JWT token" not needed if code is clear)

**JSDoc/TSDoc:**
- Multi-line comments for functions with parameters: `/** [description] */`
- Parameter descriptions: `@param [name] - [description]`
- Examples in complex functions like genetics: `/**\n * Generate random personality traits for a new pet\n */`

**Examples:**
```typescript
/**
 * Get a random rarity based on the distribution
 */
function getRandomRarity(): string { }

/**
 * Assign random genetic traits to a new pet based on rarity distribution
 * @param petId - The ID of the pet to assign traits to
 * @param traitCounts - Number of traits to assign by type { visual: number, personality: number, skill?: number }
 */
export async function assignRandomTraits(
  petId: string,
  traitCounts: { visual: number; personality: number; skill?: number }
) { }

// US-030: COPPA compliance
dateOfBirth: z.string().optional()
```

## Function Design

**Size:**
- Functions vary from 10-50 lines typically
- Smaller functions preferred for API routes
- Utility functions may be longer when performing complex operations (e.g., genetics calculations)

**Parameters:**
- Destructured props in React components
- Typed parameters in API routes and utilities
- Optional parameters marked with `?` in TypeScript

**Return Values:**
- API routes return `NextResponse` objects with explicit status codes
- Utility functions return typed values or null on error
- Async functions return Promises

## Module Design

**Exports:**
- Named exports preferred for utilities: `export function`, `export const`
- Default exports for React components (when dynamically imported)
- Type exports using `export type` keyword

**Barrel Files:**
- Not used extensively
- Imports typically specific to module

**Component Structure:**
- Client-side components marked with `'use client'` directive
- Dynamic imports with `ssr: false` for 3D and interactive components
- Props interface defined above component function
- Component function receives props parameter with destructuring

**Example Component Pattern:**
```typescript
'use client'

import dynamic from 'next/dynamic'

interface MyComponentProps {
  id: string
  name: string
  onClick?: () => void
}

export default function MyComponent(props: MyComponentProps) {
  const { id, name, onClick } = props

  return (
    // JSX
  )
}
```

## Type Safety

**TypeScript Configuration:**
- Strict mode enabled: `"strict": true`
- Requires explicit type annotations for function parameters
- No implicit `any` allowed
- Zod used for runtime schema validation and type inference

**Validation Pattern:**
```typescript
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
```

## Authentication Context

**Auth Pattern:**
- JWT tokens stored in localStorage (client-side)
- Token passed via Authorization header in API calls
- Tokens signed with secret from environment variables
- Session stored server-side in database
- No explicit auth middleware enforced globally

---

*Convention analysis: 2026-02-09*
