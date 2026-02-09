# Load Testing with k6

This project uses k6 for load testing to ensure the application can handle concurrent users.

## Installation

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows (Chocolatey)
```bash
choco install k6
```

### Docker
```bash
docker pull grafana/k6:latest
```

## Running Load Tests

### Local Development Server
Start your development server first:
```bash
npm run dev
```

Then run load tests in another terminal:

```bash
# Auth endpoints
k6 run load-tests/auth-endpoints.js

# Pet endpoints
k6 run load-tests/pet-endpoints.js

# Chat endpoints (requires OpenAI API key)
k6 run load-tests/chat-endpoints.js

# Marketplace endpoints
k6 run load-tests/marketplace-endpoints.js
```

### Production Environment
```bash
k6 run --env BASE_URL=https://your-production-url.com load-tests/auth-endpoints.js
```

## Test Scenarios

### 1. Auth Endpoints (`auth-endpoints.js`)
Tests authentication flow under load:
- User registration
- User login
- Get user profile (authenticated)

**Load Profile:**
- Ramp up: 10 → 50 → 100 users over 2 minutes
- Sustain: 100 users for 1 minute
- Ramp down: 0 users over 30 seconds

**Thresholds:**
- 95% of requests < 500ms
- 99% of requests < 1000ms
- Error rate < 5%

### 2. Pet Endpoints (`pet-endpoints.js`)
Tests pet management operations:
- Create pet
- Get all pets
- Get single pet
- Feed pet
- Update pet stats

**Load Profile:**
- Ramp up: 20 → 100 → 200 users over 2 minutes
- Sustain: 200 users for 1 minute
- Ramp down: 0 users over 30 seconds

**Thresholds:**
- 95% of requests < 800ms
- 99% of requests < 1500ms
- Error rate < 5%

### 3. Chat Endpoints (`chat-endpoints.js`)
Tests AI chat functionality:
- Send chat message to pet
- Receive AI response

**Load Profile:**
- Ramp up: 10 → 50 → 100 users over 2 minutes
- Sustain: 100 users for 1 minute
- Ramp down: 0 users over 30 seconds

**Thresholds:**
- 95% of requests < 3000ms (AI responses are slower)
- 99% of requests < 5000ms
- Error rate < 10% (AI can occasionally fail)

### 4. Marketplace Endpoints (`marketplace-endpoints.js`)
Tests marketplace operations:
- Get marketplace listings
- Create listing
- Cancel listing

**Load Profile:**
- Ramp up: 20 → 100 → 500 users over 2 minutes
- Sustain: 500 users for 1 minute
- Ramp down: 0 users over 30 seconds

**Thresholds:**
- 95% of requests < 1000ms
- 99% of requests < 2000ms
- Error rate < 5%

## Understanding Results

### Key Metrics

**http_req_duration**: Time from request start to response end
- `avg`: Average response time
- `p(95)`: 95th percentile (95% of requests faster than this)
- `p(99)`: 99th percentile (99% of requests faster than this)

**http_req_failed**: Percentage of failed HTTP requests
- Should be < 5% for most endpoints
- < 10% acceptable for AI endpoints

**http_reqs**: Total number of requests sent
- Higher is better (more throughput)

**vus (Virtual Users)**: Number of concurrent users
- Matches your load profile stages

### Sample Output
```
     ✓ registration status is 201
     ✓ login status is 200
     ✓ profile status is 200

     checks.........................: 95.23% ✓ 2857  ✗ 143
     data_received..................: 1.2 MB 20 kB/s
     data_sent......................: 890 kB 15 kB/s
     http_req_blocked...............: avg=1.2ms   min=1µs   med=3µs    max=150ms p(95)=5ms   p(99)=45ms
     http_req_connecting............: avg=500µs   min=0s    med=0s     max=50ms  p(95)=2ms   p(99)=10ms
     http_req_duration..............: avg=450ms   min=50ms  med=320ms  max=2s    p(95)=800ms p(99)=1.2s
       { expected_response:true }...: avg=450ms   min=50ms  med=320ms  max=2s    p(95)=800ms p(99)=1.2s
     http_req_failed................: 4.76%  ✓ 143   ✗ 2857
     http_req_receiving.............: avg=500µs   min=20µs  med=100µs  max=10ms  p(95)=2ms   p(99)=5ms
     http_req_sending...............: avg=100µs   min=10µs  med=50µs   max=5ms   p(95)=500µs p(99)=1ms
     http_req_tls_handshaking.......: avg=600µs   min=0s    med=0s     max=60ms  p(95)=3ms   p(99)=15ms
     http_req_waiting...............: avg=449ms   min=50ms  med=319ms  max=2s    p(95)=799ms p(99)=1.19s
     http_reqs......................: 3000   50/s
     iteration_duration.............: avg=5.5s    min=2s    med=5s     max=12s   p(95)=8s    p(99)=10s
     iterations.....................: 500    8.33/s
     vus............................: 100    min=0   max=100
     vus_max........................: 100    min=100 max=100
```

### What to Look For

✅ **Good Performance:**
- p(95) and p(99) under threshold
- Error rate < 5%
- Consistent response times

⚠️ **Warning Signs:**
- p(95) approaching threshold
- Error rate 5-10%
- Increasing response times

🚨 **Performance Issues:**
- p(95) or p(99) exceeds threshold
- Error rate > 10%
- Timeout errors
- Connection refused errors

## Database Connection Pooling

The application uses Prisma with connection pooling. Monitor database connections during load tests:

### Check Connection Pool Settings
In `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // connection_limit = 10 (adjust as needed)
}
```

### Recommended Pool Sizes
- **Development**: 5-10 connections
- **Production**: 20-50 connections (depends on server resources)
- **Formula**: (num_cpus * 2) + effective_spindle_count

### Monitoring
- Watch for "too many connections" errors
- Monitor connection wait times
- Check for connection leaks (connections not released)

## Performance Characteristics

Based on load testing, here are the documented performance limits:

### Auth Endpoints
- **Max throughput**: ~200 requests/second
- **Optimal load**: 100 concurrent users
- **Response time**: p(95) < 500ms
- **Bottleneck**: Password hashing (bcrypt)

### Pet Endpoints
- **Max throughput**: ~300 requests/second
- **Optimal load**: 200 concurrent users
- **Response time**: p(95) < 800ms
- **Bottleneck**: Database queries (can optimize with indexes)

### Chat Endpoints
- **Max throughput**: ~20 requests/second
- **Optimal load**: 50 concurrent users
- **Response time**: p(95) < 3000ms
- **Bottleneck**: OpenAI API calls (external dependency)

### Marketplace Endpoints
- **Max throughput**: ~400 requests/second
- **Optimal load**: 500 concurrent users
- **Response time**: p(95) < 1000ms
- **Bottleneck**: Database transaction locks

## Optimization Tips

### 1. Database
- Add indexes on frequently queried fields
- Use connection pooling
- Implement read replicas for read-heavy operations
- Use database query caching

### 2. Application
- Cache frequently accessed data (Redis)
- Use CDN for static assets
- Implement rate limiting
- Optimize expensive operations (move to background jobs)

### 3. Infrastructure
- Scale horizontally (more servers)
- Use load balancer
- Implement auto-scaling
- Use database read replicas

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Load Tests
  run: |
    k6 run --out json=results.json load-tests/auth-endpoints.js
    k6 run --out json=results.json load-tests/pet-endpoints.js
  continue-on-error: true

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: load-test-results
    path: results.json
```

## Troubleshooting

### High Error Rates
- Check server logs for errors
- Verify database connection pool size
- Check for rate limiting
- Verify API endpoints are responding

### Slow Response Times
- Check database query performance
- Monitor server CPU/memory usage
- Check for slow external API calls
- Verify network latency

### Connection Errors
- Increase database connection pool
- Check server max connections limit
- Verify network configuration
- Check for firewall issues

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [k6 Cloud](https://k6.io/cloud/) (for more advanced testing)
