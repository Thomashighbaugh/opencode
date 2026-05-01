# Architecture Patterns - TypeScript

## Project Structure

### Feature-Based Organization
```
src/
├── features/              # Feature modules
│   ├── auth/
│   │   ├── components/    # Auth-specific components
│   │   ├── hooks/         # Auth hooks
│   │   ├── api/           # Auth API calls
│   │   └── types.ts       # Auth types
│   └── user/
├── components/            # Shared components
│   └── ui/               # UI primitives
├── hooks/                # Shared hooks
├── lib/                  # Utilities
├── api/                  # API configuration
└── types/                # Global types
```

### Layer-Based Organization
```
src/
├── presentation/         # Components, pages
├── domain/              # Business logic
├── data/                # Data access
└── infrastructure/      # Services, config
```

## Component Patterns

### Component Composition
```typescript
// Prefer composition over inheritance
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children 
}) => {
  return (
    <button className={cn(styles.button, styles[variant], styles[size])}>
      {children}
    </button>
  );
};
```

### Custom Hooks
```typescript
// Encapsulate reusable logic
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
}
```

### Context Pattern
```typescript
// Create typed context
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: Credentials) => {
    setIsLoading(true);
    try {
      const user = await authApi.login(credentials);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
```

## State Management Patterns

### Local State
```typescript
// Component-local state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<FormData>(initialFormData);
```

### Derived State
```typescript
// Derive state from props/other state
const filteredItems = useMemo(
  () => items.filter(item => item.status === 'active'),
  [items]
);
```

### Lifted State
```typescript
// Lift state to lowest common ancestor
interface ParentProps {
  // State lives here
  selectedId: string;
  onSelect: (id: string) => void;
}
```

### Global State (Zustand)
```typescript
import { create } from 'zustand';

interface Store {
  user: User | null;
  cart: CartItem[];
  login: (user: User) => void;
  addToCart: (item: CartItem) => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  cart: [],
  login: (user) => set({ user }),
  addToCart: (item) => set((state) => ({ 
    cart: [...state.cart, item] 
  })),
}));
```

## API Patterns

### API Client
```typescript
// Centralized API client
class ApiClient {
  private baseUrl = process.env.API_URL;

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
}

export const api = new ApiClient();
```

### React Query Integration
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<User>(`/users/${id}`),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (user: User) => api.post(`/users/${user.id}`, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Error Handling Patterns

### Error Boundary
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Try-Catch Pattern
```typescript
async function fetchData<T>(endpoint: string): Promise<Result<T>> {
  try {
    const data = await api.get<T>(endpoint);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
```

## Testing Patterns

### Component Testing
```typescript
describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing
```typescript
describe('useLocalStorage', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    act(() => result.current[1]('updated'));
    expect(localStorage.getItem('key')).toBe('"updated"');
  });
});
```

## Performance Patterns

### Memoization
```typescript
// Memoize expensive transformations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// Memoize components
export const ExpensiveComponent = memo(({ data }: Props) => {
  return <ComplexUI data={data} />;
});
```

### Code Splitting
```typescript
// Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Route-based splitting
const routes = [
  { path: '/dashboard', component: lazy(() => import('./Dashboard')) },
  { path: '/settings', component: lazy(() => import('./Settings')) },
];
```

### Virtualization
```typescript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

## Next.js Specific Patterns

### App Router Structure
```
app/
├── layout.tsx           # Root layout
├── page.tsx            # Home page
├── (auth)/             # Route group
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/
│   └── page.tsx
└── api/                # API routes
    └── users/
        └── route.ts
```

### Server Actions
```typescript
// app/actions.ts
'use server';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  await db.users.create({ name, email });
  
  revalidatePath('/users');
}
```

### Server Components
```typescript
// app/users/page.tsx
async function UsersPage() {
  const users = await db.users.findMany(); // Direct DB access
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```