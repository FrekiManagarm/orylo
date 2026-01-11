# ADR-008: Real-Time Updates Strategy

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Le dashboard Orylo doit afficher les **nouvelles détections de fraude en temps réel** pour offrir une expérience réactive.

**Use Cases** :
- 🎯 **Dashboard principal** : Afficher nouvelles detections automatiquement
- 🚨 **War Room mode** : Lors d'attaque massive, updates ultra-fréquents
- 📊 **Metrics live** : Compteurs qui s'incrémentent en temps réel
- 🔔 **Notifications** : Toast notifications pour actions requises

**User Story** :
> En tant que Thomas (Marchand), quand une attaque card testing commence (10 tentatives en 2 min), je veux voir mon dashboard se mettre à jour automatiquement sans rafraîchir la page, afin de réagir rapidement.

**Contraintes** :
- Latency acceptable : 1-5s (pas besoin sub-second pour notifications)
- Budget : ~$0-20/mois pour démarrer
- Architecture : Vercel Serverless (compatibilité requise)
- Users concurrents : 10-100 pour Phase 1

**Volume estimé** :
- Phase 1 : 10-50 connexions simultanées
- Phase 2 : 100-500 connexions simultanées
- Phase 3 : 500-2000 connexions simultanées

---

## Decision

**Nous choisissons : Server-Sent Events (SSE)**

```typescript
Architecture:
├─ Endpoint: GET /api/v1/events
├─ Protocol: Server-Sent Events (HTTP streaming)
├─ Poll interval: 5s (backend polls DB)
├─ Auto-reconnect: Browser native
├─ Latency: 1-5s (acceptable pour notifications)
└─ Cost: $0 (included avec Vercel)
```

**Backend Implementation** :

```typescript
// app/api/v1/events/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // SSE needs long-lived connection

export async function GET(request: Request) {
  // 1. Authentication
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const organizationId = OrganizationId(
    session.session.activeOrganizationId
  );
  
  // 2. Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`
      );
      
      let lastCheck = Date.now();
      
      // Poll for new detections every 5s
      const interval = setInterval(async () => {
        try {
          // Fetch detections since last check
          const newDetections = await withOrgContext(organizationId, async () => {
            return db.query.fraudDetections.findMany({
              where: gte(fraudDetections.createdAt, new Date(lastCheck)),
              orderBy: desc(fraudDetections.createdAt),
              limit: 50,
            });
          });
          
          if (newDetections.length > 0) {
            // Send new detections event
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'new_detections',
                data: newDetections,
                timestamp: Date.now(),
              })}\n\n`
            );
            
            lastCheck = Date.now();
          }
          
          // Send heartbeat every 30s (keep connection alive)
          if (Date.now() - lastCheck > 30_000) {
            controller.enqueue(
              `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
            );
          }
        } catch (error) {
          logger.error('SSE poll error', { error, organizationId });
        }
      }, 5_000); // Poll every 5s
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
        logger.info('SSE connection closed', { organizationId });
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
```

**Frontend Implementation** :

```typescript
// hooks/useRealtimeDetections.ts
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useRealtimeDetections() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource('/api/v1/events');
    
    eventSource.addEventListener('open', () => {
      console.log('SSE connected');
    });
    
    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('SSE connection established');
          break;
          
        case 'new_detections':
          // Invalidate React Query cache
          queryClient.invalidateQueries({ queryKey: ['detections'] });
          
          // Show toast notification
          const count = data.data.length;
          const hasBlocked = data.data.some(d => d.decision === 'BLOCK');
          
          toast.success(
            `${count} nouvelle${count > 1 ? 's' : ''} détection${count > 1 ? 's' : ''}`,
            {
              description: hasBlocked ? '⚠️ Certaines transactions bloquées' : undefined,
            }
          );
          break;
          
        case 'heartbeat':
          // Connection is alive
          break;
      }
    });
    
    eventSource.addEventListener('error', (error) => {
      console.error('SSE error', error);
      eventSource.close();
      
      // Browser will auto-reconnect after a few seconds
    });
    
    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}

// Usage in Dashboard
export default function DashboardPage() {
  useRealtimeDetections(); // Enable real-time updates
  
  const { data: detections } = useQuery({
    queryKey: ['detections'],
    queryFn: fetchDetections,
  });
  
  return <div>...</div>;
}
```

---

## Alternatives Considered

### Alternative 1: WebSockets (via Pusher/Ably)

```typescript
// Backend
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
});

// Trigger event
await pusher.trigger(
  `org-${organizationId}`,
  'new-detection',
  { detection: fraudResult }
);

// Frontend
import Pusher from "pusher-js";

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!);
const channel = pusher.subscribe(`org-${organizationId}`);

channel.bind('new-detection', (data) => {
  queryClient.invalidateQueries(['detections']);
  toast.success('Nouvelle détection !');
});
```

**Avantages** :
- **Bi-directional** : Client ↔ Server
- **Ultra low-latency** : < 100ms
- **Scalable** : Millions de connexions
- **Channels** : Isolation par org automatique

**Inconvénients** :
- **Coût** : Pusher = $49/mois pour 500 connexions concurrentes
- **Dependency externe** : Vendor lock-in
- **Complexité** : Setup + auth + permissions

**Rejeté car** : Coût trop élevé pour MVP, SSE suffit pour latency 1-5s

---

### Alternative 2: Polling (Simple)

```typescript
// Frontend: Poll every 10s
const { data: detections } = useQuery({
  queryKey: ['detections'],
  queryFn: fetchDetections,
  refetchInterval: 10_000, // 10s
});
```

**Avantages** :
- **Ultra-simple** : Aucun code spécial
- **Zero cost** : Juste des API calls normales
- **Reliable** : Pas de connexion longue

**Inconvénients** :
- **Latency élevée** : 5-10s delay
- **Inefficient** : Requêtes même si rien de nouveau
- **Load** : 100 users = 100 req/10s = 600 req/min
- **Battery drain** : Mobile polling = drain batterie

**Rejeté car** : Mauvaise UX (trop lent), inefficient

---

### Alternative 3: WebSockets Natif (DIY)

```typescript
// Backend (needs dedicated WebSocket server)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Handle message
  });
  
  ws.send(JSON.stringify({ type: 'connected' }));
});

// Frontend
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle event
};
```

**Avantages** :
- Pas de coût externe
- Full control

**Inconvénients** :
- **Besoin d'un serveur WebSocket dédié** ⚠️ (pas serverless)
- **DevOps overhead** : Scaling, monitoring
- **Complexité** : Auth, reconnection, heartbeat

**Rejeté car** : Pas serverless-friendly, trop complexe pour MVP

---

## Consequences

### Positive
- ✅ **Simple** : HTTP standard, pas de protocole complexe
- ✅ **Unidirectional** : Server → Client (parfait pour notifications)
- ✅ **Vercel compatible** : Fonctionne en serverless (long-lived connections)
- ✅ **Auto-reconnect** : Browser reconnecte automatiquement si déconnexion
- ✅ **Lightweight** : Moins d'overhead que WebSockets
- ✅ **Zero cost** : Included avec Vercel
- ✅ **Latency acceptable** : 1-5s suffisant pour notifications

### Negative
- ⚠️ **Unidirectional only** : Pas Client → Server real-time (mais pas besoin)
- ⚠️ **Connexion longue** : Peut être fermée par proxies (mais auto-reconnect)
- ⚠️ **Poll-based** : Backend poll DB toutes les 5s (pas push natif)

### Neutral
- 🔄 **Migration path exists** : Peut upgrader vers WebSockets (Pusher) plus tard si besoin < 1s latency
- 🔄 **Battery efficient** : Moins drain que polling

---

## Implementation Notes

### 1. Frontend Reconnection Logic

```typescript
// hooks/useRealtimeDetections.ts
export function useRealtimeDetections() {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    const connect = () => {
      eventSource = new EventSource('/api/v1/events');
      
      eventSource.addEventListener('open', () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        toast.success('Connexion en temps réel activée');
      });
      
      eventSource.addEventListener('error', () => {
        setIsConnected(false);
        setReconnectAttempts(prev => prev + 1);
        
        if (reconnectAttempts > 5) {
          toast.error('Impossible de se connecter en temps réel');
          eventSource?.close();
        }
      });
      
      // ... rest of handlers
    };
    
    connect();
    
    return () => {
      eventSource?.close();
    };
  }, []);
  
  return { isConnected, reconnectAttempts };
}
```

### 2. Backend Scalability (Multiple Instances)

```typescript
// Challenge: Multiple Vercel instances = multiple SSE connections
// Solution: Database as source of truth (eventually consistent)

// Each instance polls DB independently
// Users see updates within 5s (poll interval)
// No coordination needed between instances ✅
```

### 3. War Room Mode (High Frequency Updates)

```typescript
// hooks/useWarRoomMode.ts
export function useWarRoomMode(isAttackDetected: boolean) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (isAttackDetected) {
      // Increase refresh frequency
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['detections'] });
      }, 2_000); // Every 2s during attack
      
      return () => clearInterval(interval);
    }
  }, [isAttackDetected, queryClient]);
}
```

### 4. Monitoring & Metrics

```typescript
// Track SSE connections
let activeConnections = 0;

export async function GET(request: Request) {
  activeConnections++;
  logger.info('SSE connection opened', { activeConnections });
  
  const stream = new ReadableStream({
    start(controller) {
      // ...
      
      request.signal.addEventListener('abort', () => {
        activeConnections--;
        logger.info('SSE connection closed', { activeConnections });
      });
    },
  });
  
  return new Response(stream, { headers });
}

// Expose metrics
// GET /api/admin/metrics
{
  sse: {
    activeConnections: 42,
    totalConnectionsToday: 1250,
    avgConnectionDuration: 1800, // 30 minutes
  }
}
```

---

## Performance Considerations

**Bandwidth Usage** :

```
Heartbeat (every 30s): ~50 bytes
New detection event: ~500 bytes

100 concurrent users:
├─ Heartbeats: 100 × (50 bytes × 120/hour) = 600 KB/hour
├─ Events (avg 10/hour): 100 × (500 bytes × 10) = 500 KB/hour
└─ Total: ~1.1 MB/hour = ~800 MB/month ✅ (negligible)
```

**Database Load** :

```
Poll interval: 5s
Query time: ~10ms (indexed, with RLS)

100 concurrent users:
├─ Queries/second: 100 / 5 = 20 req/s
├─ DB load: 20 × 10ms = 200ms CPU/s = 20% utilization
└─ Acceptable ✅
```

---

## Related Decisions
- ADR-001: Deployment (Vercel serverless supports SSE)
- ADR-002: Database (RLS garantit chaque user voit seulement ses données)
- ADR-007: API Architecture (SSE endpoint fait partie de l'API v1)

---

## Review Schedule
- **1 mois**: Analyser latency réelle (target: < 5s P95)
- **3 mois**: Vérifier si SSE connections causent problèmes de scale
- **6 mois**: Revoir si migration vers WebSockets (Pusher) justifiée si besoin < 1s latency
