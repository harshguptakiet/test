# Issue #007: Optimize Frontend Performance and Implement Proper State Management

## 📋 **Issue Type**
- [x] Enhancement
- [x] Bug Fix
- [ ] Feature Request
- [ ] Documentation

## 🎯 **Priority**
**Medium** - User experience and scalability

## 📝 **Description**
The CuraGenie frontend currently has performance issues, inefficient state management, and lacks proper optimization for production use. The application loads slowly, has unnecessary re-renders, and doesn't handle large datasets efficiently, particularly in genomic visualization components.

## 🔍 **Current Problems**

### 1. **Performance Issues**
From the build analysis in `TESTING_RESULTS.md`:
- **Large bundle size**: Dashboard/visualizations route is 269 kB
- **Slow build time**: ~94 seconds for build
- **Heavy components**: Genomic visualization components likely causing performance issues

### 2. **Inefficient State Management**
```typescript
// Found in auth-store.ts - Basic Zustand implementation
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  // ❌ No proper error handling state
  // ❌ No request caching
  // ❌ No optimistic updates
}
```

### 3. **Missing Performance Optimizations**
- No code splitting beyond basic Next.js defaults
- No lazy loading for heavy components
- No image optimization
- No proper caching strategies
- No bundle analysis or monitoring

### 4. **Inefficient Data Fetching**
```typescript
// Likely patterns in components (no caching, no deduplication)
const fetchData = async () => {
  const response = await fetch(`${API_URL}/api/data`)  // ❌ No caching
  setData(await response.json())  // ❌ No loading states
}

useEffect(() => {
  fetchData()  // ❌ Re-fetches on every render
}, [])
```

### 5. **Heavy Visualization Components**
The genomic browser and visualization components likely have performance issues:
- No virtualization for large datasets
- No debounced search/filtering
- Heavy D3.js operations on main thread
- No progressive loading of genomic data

### 6. **Poor Mobile Performance**
- Large bundle sizes affecting mobile users
- No progressive web app features
- Missing offline capabilities
- No responsive image optimization

## 🎯 **Proposed Solution**

### 1. **Advanced State Management with React Query**
```typescript
// lib/query-client.ts - Optimized data fetching
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// hooks/useGenomicData.ts - Optimized genomic data fetching
export function useGenomicData(userId: number, options = {}) {
  return useQuery({
    queryKey: ['genomic-data', userId],
    queryFn: async () => {
      const response = await fetch(`/api/genomic-data/user/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch genomic data')
      return response.json()
    },
    enabled: !!userId,
    ...options
  })
}

export function useUploadGenomicData() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/genomic-data/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Upload failed')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch genomic data
      queryClient.invalidateQueries(['genomic-data'])
    },
  })
}
```

### 2. **Component Optimization and Code Splitting**
```typescript
// components/genomic/LazyGenomeBrowser.tsx - Lazy loaded heavy component
import dynamic from 'next/dynamic'

const GenomeBrowser = dynamic(() => import('./GenomeBrowser'), {
  loading: () => <GenomeBrowserSkeleton />,
  ssr: false, // Disable SSR for heavy client-side components
})

// components/genomic/VirtualizedVariantList.tsx - Virtualized large lists
import { FixedSizeList } from 'react-window'

interface VirtualizedVariantListProps {
  variants: GenomicVariant[]
  height: number
}

export function VirtualizedVariantList({ variants, height }: VirtualizedVariantListProps) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <VariantRow variant={variants[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={height}
      itemCount={variants.length}
      itemSize={60}
      overscanCount={10}
    >
      {Row}
    </FixedSizeList>
  )
}

// components/ui/OptimizedImage.tsx - Optimized image component
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  priority?: boolean
}

export function OptimizedImage({ src, alt, priority = false }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  )
}
```

### 3. **Performance Monitoring and Bundle Analysis**
```typescript
// next.config.js - Production optimizations
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Bundle splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)

// lib/performance.ts - Performance monitoring
export function trackWebVitals(metric) {
  const { id, name, label, value } = metric

  // Track to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    })
  }

  // Performance budget alerts
  const performanceBudget = {
    FCP: 2000, // First Contentful Paint
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
  }

  if (value > performanceBudget[name]) {
    console.warn(`Performance budget exceeded for ${name}: ${value}`)
  }
}
```

### 4. **Advanced Caching and Offline Support**
```typescript
// lib/cache-manager.ts - Intelligent caching
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const cacheManager = new CacheManager()

// service-worker.js - Offline support
const CACHE_NAME = 'curagenie-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})
```

## 🛠️ **Implementation Tasks**

### Phase 1: Performance Analysis and Baseline
- [ ] Implement bundle analysis with webpack-bundle-analyzer
- [ ] Set up Lighthouse CI for performance monitoring
- [ ] Create performance budgets and alerts
- [ ] Analyze current bundle composition and identify optimization opportunities
- [ ] Establish baseline performance metrics

### Phase 2: State Management Optimization
- [ ] Migrate from basic Zustand to React Query for server state
- [ ] Implement optimistic updates for better UX
- [ ] Add proper error handling and retry logic
- [ ] Create global state management for UI state
- [ ] Implement request deduplication and caching

### Phase 3: Component Optimization
- [ ] Implement code splitting for heavy components
- [ ] Add lazy loading for genomic visualization components
- [ ] Optimize re-rendering with React.memo and useMemo
- [ ] Implement virtualization for large data lists
- [ ] Add progressive loading for genomic data

### Phase 4: Bundle Optimization
- [ ] Implement advanced webpack splitting strategies
- [ ] Optimize package imports and reduce bundle size
- [ ] Add tree shaking for unused code elimination
- [ ] Implement dynamic imports for route-level splitting
- [ ] Optimize third-party library usage

### Phase 5: Advanced Features
- [ ] Implement Progressive Web App features
- [ ] Add service worker for offline support
- [ ] Create image optimization pipeline
- [ ] Add web vitals monitoring
- [ ] Implement intelligent prefetching

## ⚡ **Performance Optimizations**

### Bundle Size Reduction
```typescript
// utils/dynamic-imports.ts - Smart dynamic imports
export const loadGenomicVisualizations = () =>
  import('@/components/genomic/visualizations').then((mod) => mod.GenomicVisualizations)

export const loadMRIViewer = () =>
  import('@/components/medical/mri-viewer').then((mod) => mod.MRIViewer)

// Only load D3 when needed
export const loadD3Utilities = async () => {
  const [d3Scale, d3Selection, d3Axis] = await Promise.all([
    import('d3-scale'),
    import('d3-selection'),
    import('d3-axis'),
  ])
  return { d3Scale, d3Selection, d3Axis }
}

// hooks/useDeferredValue.ts - Debounced values for performance
import { useDeferredValue, useMemo } from 'react'

export function useDebouncedSearch(searchTerm: string, delay = 300) {
  const deferredSearchTerm = useDeferredValue(searchTerm)
  
  return useMemo(() => {
    // Expensive search logic here
    return deferredSearchTerm
  }, [deferredSearchTerm])
}
```

### Memory Optimization
```typescript
// hooks/useGenomicDataStream.ts - Streaming large datasets
export function useGenomicDataStream(userId: number, pageSize = 1000) {
  const [data, setData] = useState<GenomicVariant[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/genomic-data/user/${userId}/variants?page=${data.length / pageSize}&size=${pageSize}`
      )
      const newData = await response.json()
      
      if (newData.length < pageSize) {
        setHasMore(false)
      }
      
      setData(prev => [...prev, ...newData])
    } finally {
      setLoading(false)
    }
  }, [userId, data.length, pageSize, loading, hasMore])

  return { data, loadMore, hasMore, loading }
}

// components/genomic/OptimizedGenomeBrowser.tsx - Memory-efficient genomic browser
export function OptimizedGenomeBrowser({ userId }: { userId: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 1000 })
  
  const { data: variants } = useGenomicData(userId, {
    select: useCallback(
      (data: GenomicVariant[]) => 
        data.slice(visibleRange.start, visibleRange.end),
      [visibleRange]
    ),
  })

  // Update visible range based on scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = throttle(() => {
      const scrollTop = container.scrollTop
      const itemHeight = 60
      const containerHeight = container.clientHeight
      
      const start = Math.floor(scrollTop / itemHeight)
      const end = start + Math.ceil(containerHeight / itemHeight) + 10
      
      setVisibleRange({ start, end })
    }, 16) // 60fps throttling

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="h-96 overflow-auto">
      <VirtualizedVariantList variants={variants || []} height={384} />
    </div>
  )
}
```

## 📊 **Performance Targets**

### Core Web Vitals Goals
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds  
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### Bundle Size Goals
- **Initial JavaScript**: < 200KB gzipped
- **CSS**: < 50KB gzipped
- **Images**: WebP/AVIF with proper sizing
- **Total Page Weight**: < 1MB on initial load

### User Experience Metrics
- **Time to Interactive**: < 3 seconds
- **Speed Index**: < 2 seconds
- **Total Blocking Time**: < 200 milliseconds
- **Mobile Performance Score**: > 90 (Lighthouse)

## 🔧 **Monitoring and Analysis Tools**

### Performance Monitoring Stack
```typescript
// lib/performance-monitor.ts
export class PerformanceMonitor {
  private observer: PerformanceObserver

  constructor() {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry)
      }
    })

    this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    // Send to analytics service
    if (entry.entryType === 'navigation') {
      this.trackPageLoad(entry as PerformanceNavigationTiming)
    } else if (entry.entryType === 'resource') {
      this.trackResourceLoad(entry as PerformanceResourceTiming)
    }
  }

  markStart(name: string) {
    performance.mark(`${name}-start`)
  }

  markEnd(name: string) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### Bundle Analysis Configuration
```json
// package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "lighthouse": "lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json",
    "perf-test": "npm run build && npm run lighthouse"
  }
}
```

## 🧪 **Testing Strategy**

### Performance Testing
- [ ] Lighthouse CI integration for automated performance testing
- [ ] Bundle size monitoring in CI/CD pipeline
- [ ] Memory leak detection in long-running sessions
- [ ] Mobile performance testing on various devices
- [ ] Load testing for genomic data visualization

### User Experience Testing  
- [ ] Core Web Vitals tracking in production
- [ ] Real User Monitoring (RUM) implementation
- [ ] A/B testing for performance optimizations
- [ ] Accessibility performance testing
- [ ] Progressive loading UX validation

## 🎯 **Acceptance Criteria**
- [ ] Core Web Vitals meet Google's thresholds
- [ ] Bundle size reduced by at least 30%
- [ ] Page load time improved by at least 40%
- [ ] Mobile performance score > 90
- [ ] Zero memory leaks in production
- [ ] Proper offline functionality for core features
- [ ] Performance monitoring and alerting active
- [ ] Documentation for performance best practices

## 📊 **Success Metrics**
- **Page Load Speed**: 50% improvement in LCP
- **Bundle Size**: 30% reduction in initial JavaScript
- **User Engagement**: 20% increase in session duration
- **Mobile Experience**: 90+ Lighthouse performance score
- **Error Rate**: <1% performance-related errors

## 🔗 **Related Files**
- `frontend/next.config.js` - Build optimizations
- `frontend/package.json` - Performance monitoring scripts
- `frontend/src/lib/performance.ts` - Performance utilities
- `frontend/src/hooks/` - Optimized custom hooks
- `frontend/src/components/` - Performance-optimized components
- `.github/workflows/performance.yml` - Performance CI/CD

**Estimated Effort**: 2-3 weeks  
**Dependencies**: Issue #006 (Testing infrastructure for performance testing)
**Risk Level**: Low (improvements to existing functionality)
