# ✅ PACK 1 — AUTH MODULE — COMPLETE

## Files Created

1. **`src/lib/supabaseClient.ts`** - Supabase client setup
2. **`src/services/auth.ts`** - Auth API wrapper (register, login, logout, resetPassword)
3. **`src/services/profile.ts`** - Profile management (ensureProfile, getProfile, updateProfile)
4. **`src/context/AuthContext.tsx`** - Global auth state management
5. **`src/components/Protected.tsx`** - Protected route wrapper
6. **`src/app/auth/login.tsx`** - Login screen
7. **`src/app/auth/register.tsx`** - Register screen
8. **`src/app/auth/forgot.tsx`** - Forgot password screen

## Features

✅ Supabase Auth integration
✅ Profile auto-creation on signup
✅ Global auth state (useAuth hook)
✅ Protected routes
✅ Expo + Web compatible
✅ TypeScript support
✅ Error handling
✅ Loading states

## Usage

### Wrap your app with AuthProvider:

```tsx
// app/_layout.tsx
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Your app */}
    </AuthProvider>
  );
}
```

### Use auth in components:

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, profile, loading } = useAuth();
  // ...
}
```

### Protect routes:

```tsx
import Protected from '../components/Protected';

export default function ProtectedScreen() {
  return (
    <Protected>
      {/* Protected content */}
    </Protected>
  );
}
```

## Next: PACK 2 — FUEL SYSTEM

