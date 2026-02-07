# PRD: AR Pet App MVP

## Introduction

An augmented reality virtual pet application that combines Tamagotchi-style care mechanics with advanced AI, genetics-based breeding, and educational capabilities. Users (primarily teens aged 13-17) can interact with their AI-powered pets through both a web application and AR on mobile devices. Each pet has a unique personality driven by GPT-4o-mini, persistent memory, and genetic traits inherited through a sophisticated breeding system. Pets can learn specialized skills (teaching, chess, etc.) purchased from a marketplace and use these to educate their owners in a conversational manner.

The app merges the genetic inheritance model from forkMonkey (rarity tiers, mutation mechanics) with emotional intelligence features from AI-Pet (emotion detection, personalized responses) while adding survival mechanics and an educational layer.

## Goals

- Launch simultaneously on web (desktop/mobile browser) and AR (iOS/Android via WebXR or native AR)
- Implement full genetics system with 4 rarity tiers (common, uncommon, rare, legendary)
- Create engaging survival mechanics with warning systems that prevent permanent pet death
- Enable real-money skill marketplace for purchasing educational and personality skill sets
- Power each pet with GPT-4o-mini LLM with hybrid memory (detailed recent + summarized historical)
- Allow pets to teach owners conversationally based on acquired skills
- Support breeding between pets to create offspring with inherited traits
- Provide seamless experience across web and AR platforms

## User Stories

### US-001: User Registration and Authentication
**Description:** As a new user, I want to create an account so that my pets and progress are saved across sessions and devices.

**Acceptance Criteria:**
- [ ] Email/password registration with validation
- [ ] OAuth options (Google, Apple Sign-In)
- [ ] Email verification flow
- [ ] Secure password requirements (min 8 chars, special chars)
- [ ] JWT-based authentication
- [ ] Session persists across web and AR platforms
- [ ] Typecheck/lint passes

### US-002: Pet Creation with Genetics Initialization
**Description:** As a new user, I want to create my first pet with randomly generated genetic traits so that each pet is unique.

**Acceptance Criteria:**
- [ ] Pet creation wizard with name input
- [ ] Random generation of genetic traits across 4 rarity tiers
- [ ] Visual traits (color, pattern, accessories) visible immediately
- [ ] Personality traits (friendliness, energy, curiosity) initialized
- [ ] Each pet assigned unique ID and creation timestamp
- [ ] First pet creation is free
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Pet Trait System (Database Schema)
**Description:** As a developer, I need a robust trait storage system so that genetic inheritance works correctly.

**Acceptance Criteria:**
- [ ] Traits table with fields: trait_id, trait_name, trait_type (visual/personality/skill), rarity (common/uncommon/rare/legendary), description
- [ ] PetTraits junction table linking pets to traits with inheritance_source (parent1/parent2/mutation)
- [ ] Minimum 20 predefined traits across all categories
- [ ] Rarity probability distribution: Common 60%, Uncommon 25%, Rare 10%, Legendary 5%
- [ ] Migration runs successfully
- [ ] Typecheck passes

### US-004: Web App Pet Dashboard
**Description:** As a user, I want to see my pet's current state on the web dashboard so I can monitor health, happiness, and stats.

**Acceptance Criteria:**
- [ ] Dashboard displays pet 3D model or avatar
- [ ] Real-time stats: Health (0-100), Hunger (0-100), Happiness (0-100), Energy (0-100)
- [ ] Visual health indicators (color-coded: green >70, yellow 40-70, red <40)
- [ ] Pet's personality traits displayed as badges
- [ ] Current active skills shown
- [ ] Last interaction timestamp
- [ ] Generation number and lineage info
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: AR Pet Viewing
**Description:** As a user, I want to view my pet in augmented reality so I can see it in my physical environment.

**Acceptance Criteria:**
- [ ] AR session launches from web app (WebXR) or native AR app
- [ ] Pet 3D model appears in user's environment via device camera
- [ ] Pet positioned on detected surface (floor/table)
- [ ] Pet animations play (idle, happy, hungry states)
- [ ] Visual traits (color, patterns, accessories) match pet's genetics
- [ ] AR session maintains 30+ FPS on target devices
- [ ] Typecheck/lint passes
- [ ] Test on iOS and Android AR

### US-006: Feeding System
**Description:** As a user, I want to feed my pet so it stays healthy and doesn't get sick.

**Acceptance Criteria:**
- [ ] Feed button available in both web and AR interfaces
- [ ] Feeding reduces Hunger stat by 30-40 points
- [ ] Feeding has cooldown (cannot spam feed)
- [ ] Food inventory system (virtual food items)
- [ ] Feeding increases Happiness slightly (+5-10)
- [ ] Animation plays when feeding (web and AR)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: Health Warning System
**Description:** As a user, I want to receive warnings when my pet is becoming unhealthy so I can prevent it from dying.

**Acceptance Criteria:**
- [ ] Warning notification when Hunger > 80 ("Your pet is very hungry!")
- [ ] Warning notification when Health < 30 ("Your pet is getting sick!")
- [ ] Pet visual state changes to "sick" appearance when Health < 40
- [ ] Push notifications enabled (web and mobile)
- [ ] Email alerts for critical state (Health < 20)
- [ ] Warning clears when stats improve
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: Pet Death Prevention and Recovery
**Description:** As a user, I want my pet to enter a sick/recovery state rather than dying permanently so I don't lose my companion.

**Acceptance Criteria:**
- [ ] Pet enters "Critical" state when Health reaches 0 (doesn't die)
- [ ] In Critical state, pet cannot interact or breed
- [ ] Recovery item available (purchasable or earnable)
- [ ] Using recovery item restores Health to 50 and exits Critical state
- [ ] Stats degrade slower during first 24 hours of neglect
- [ ] Penalty system: Pet loses 10% max stats after recovery
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-009: LLM Integration with GPT-4o-mini
**Description:** As a user, I want to have conversations with my pet so it feels like a real companion.

**Acceptance Criteria:**
- [ ] Chat interface in web app
- [ ] Voice input option in AR mode
- [ ] GPT-4o-mini integration via OpenAI API
- [ ] System prompt includes pet's personality traits
- [ ] Response time < 3 seconds for text, < 5 seconds for voice
- [ ] Conversation history stored in database
- [ ] API error handling with fallback messages
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-010: Hybrid Memory System
**Description:** As a developer, I need to implement hybrid memory so pets remember recent interactions in detail and have summarized long-term memory.

**Acceptance Criteria:**
- [ ] Store last 50 interactions with full detail (messages, context, timestamp)
- [ ] Summarize interactions older than 30 days using GPT-4o-mini
- [ ] Summary stored as condensed memories (max 500 tokens)
- [ ] Memory retrieval includes recent (full) + historical (summarized)
- [ ] Memory context injected into LLM system prompt
- [ ] Memory summarization runs daily via cron job
- [ ] Typecheck passes

### US-011: Pet Personality System
**Description:** As a user, I want my pet to have a consistent personality that affects our interactions so it feels unique.

**Acceptance Criteria:**
- [ ] Personality traits influence LLM responses (e.g., high curiosity = asks questions)
- [ ] Traits: Friendliness (0-100), Energy (0-100), Curiosity (0-100), Patience (0-100), Playfulness (0-100)
- [ ] Personality traits inherited from parents during breeding
- [ ] Traits visible on pet profile
- [ ] LLM system prompt dynamically generated from trait values
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-012: Breeding System Foundation
**Description:** As a user, I want to breed two pets so I can create offspring with combined traits.

**Acceptance Criteria:**
- [ ] Breeding requires two pets owned by user (or one owned + one from friend)
- [ ] Both pets must be adult (7+ days old) and healthy (Health > 50)
- [ ] Breeding cooldown: 7 days per pet
- [ ] Breeding UI shows both parent pets and compatibility score
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-013: Genetics Inheritance Algorithm
**Description:** As a developer, I need to implement forkMonkey-style genetics so offspring inherit traits from parents with mutations.

**Acceptance Criteria:**
- [ ] Offspring receives 50% traits from Parent 1, 50% from Parent 2 (random selection per trait)
- [ ] 15% chance of mutation per trait (generates new random trait of same type)
- [ ] Mutations respect rarity distribution (60% common, 25% uncommon, 10% rare, 5% legendary)
- [ ] Generation number = max(parent1_gen, parent2_gen) + 1
- [ ] Legendary traits can appear through mutation or inheritance
- [ ] Offspring personality = average of parents + random variance (±15)
- [ ] Typecheck passes

### US-014: Genetics Visualization
**Description:** As a user, I want to see the genetic lineage of my pet so I understand its heritage.

**Acceptance Criteria:**
- [ ] Family tree view showing parents, grandparents
- [ ] Each ancestor shows generation number and key traits
- [ ] Visual indicators for inherited vs mutated traits
- [ ] Clickable ancestors to view full profile
- [ ] Export lineage as image or PDF
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-015: Skill Marketplace UI
**Description:** As a user, I want to browse available skills to purchase for my pet so I can enhance its capabilities.

**Acceptance Criteria:**
- [ ] Marketplace page with skill categories (Education, Games, Arts, Sports)
- [ ] Each skill shows: name, description, price, icon, preview
- [ ] Filter by category and price range
- [ ] Search functionality
- [ ] Popular/Featured skills highlighted
- [ ] User's owned skills marked as "Owned"
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-016: Skill Purchase Flow (IAP Integration)
**Description:** As a user, I want to purchase skills with real money so my pet can learn new capabilities.

**Acceptance Criteria:**
- [ ] Integration with Stripe for web payments
- [ ] Integration with Apple IAP and Google Play Billing for mobile
- [ ] Price tiers: $0.99, $1.99, $4.99 per skill
- [ ] Purchase confirmation dialog before payment
- [ ] Receipt generation and email confirmation
- [ ] Skills immediately available after purchase
- [ ] Failed payment error handling
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-017: Skill Activation and Storage
**Description:** As a developer, I need to store purchased skills and activate them for pets so they modify pet behavior.

**Acceptance Criteria:**
- [ ] UserSkills table: user_id, skill_id, purchase_date, active
- [ ] PetSkills table: pet_id, skill_id, proficiency (0-100), activated_date
- [ ] User can assign purchased skill to any of their pets
- [ ] Maximum 5 active skills per pet (MVP limit)
- [ ] Skills persist across sessions
- [ ] Typecheck passes

### US-018: Teaching Skill Implementation
**Description:** As a user, I want my pet to teach me about topics when it has teaching skills so I can learn from it.

**Acceptance Criteria:**
- [ ] Teaching skills: Math Tutor, Science Teacher, History Buff, Language Coach
- [ ] When skill active, pet can answer questions on that topic
- [ ] LLM system prompt includes skill knowledge domain
- [ ] Pet proactively asks if user wants to learn (based on conversation context)
- [ ] Conversational teaching style (no formal lessons for MVP)
- [ ] Pet references skill in responses ("As your math tutor, I can help with...")
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-019: Game Skill Implementation (Chess)
**Description:** As a user, I want to play chess with my pet when it has the chess skill so we can compete.

**Acceptance Criteria:**
- [ ] Chess skill enables conversational chess play
- [ ] Pet can play chess via algebraic notation (e.g., "I move pawn to e4")
- [ ] Simple board visualization in chat (ASCII or basic UI)
- [ ] Pet uses chess engine API or LLM chess capability
- [ ] Game state persists across sessions
- [ ] Pet can explain moves and teach chess strategy
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-020: AR Interaction Controls
**Description:** As a user, I want to interact with my pet in AR beyond just viewing it so the experience is engaging.

**Acceptance Criteria:**
- [ ] Tap pet to trigger animation (happy, play, dance)
- [ ] Feed button available in AR overlay
- [ ] Voice chat activation in AR mode
- [ ] Pet responds to voice with animations and text/voice responses
- [ ] Gesture recognition (pet comes to user if they wave)
- [ ] AR session can run for 30+ minutes without crashes
- [ ] Typecheck/lint passes
- [ ] Test on iOS and Android AR

### US-021: Stat Degradation System
**Description:** As a developer, I need to implement automatic stat degradation so pets require ongoing care.

**Acceptance Criteria:**
- [ ] Hunger increases by 1 point per hour
- [ ] Happiness decreases by 0.5 points per hour without interaction
- [ ] Energy decreases by 0.3 points per hour, recovers during "sleep" (midnight-6am user timezone)
- [ ] Health decreases by 2 points per hour if Hunger > 80
- [ ] Background job runs every 15 minutes to update stats
- [ ] Stats cannot go below 0 or above 100
- [ ] Typecheck passes

### US-022: Daily Engagement System
**Description:** As a user, I want daily rewards for checking on my pet so I'm encouraged to return regularly.

**Acceptance Criteria:**
- [ ] Daily login bonus (virtual currency or free food)
- [ ] Streak counter (consecutive days)
- [ ] Special rewards at streak milestones (7, 30, 100 days)
- [ ] Push notification reminder if user hasn't logged in for 24 hours
- [ ] Daily challenge (e.g., "Feed your pet 3 times today")
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-023: Multi-Pet Management
**Description:** As a user, I want to own multiple pets so I can breed them and have variety.

**Acceptance Criteria:**
- [ ] User can own up to 10 pets simultaneously (MVP limit)
- [ ] Pet selection screen shows all owned pets
- [ ] Switch between pets from dashboard
- [ ] Each pet has independent stats, memory, and personality
- [ ] Bulk actions: Feed all, Check all health
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-024: Social Features - Friend System
**Description:** As a user, I want to add friends so I can breed my pet with theirs.

**Acceptance Criteria:**
- [ ] Friend request system (send, accept, decline)
- [ ] Friends list showing online status
- [ ] View friend's pet profiles (stats, traits, lineage)
- [ ] Request breeding with friend's pet (requires approval)
- [ ] Friend limit: 50 friends for MVP
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-025: Cross-Platform Pet Sync
**Description:** As a user, I want my pet's state to sync between web and AR apps so I can switch seamlessly.

**Acceptance Criteria:**
- [ ] Real-time sync of pet stats across platforms (WebSocket or polling)
- [ ] Interactions in AR immediately reflect in web app
- [ ] Memory/conversations sync within 5 seconds
- [ ] Conflict resolution if user interacts on both platforms simultaneously
- [ ] Offline mode: Queue actions and sync when reconnected
- [ ] Typecheck passes

### US-026: 3D Pet Model System
**Description:** As a developer, I need a 3D model system that adapts to genetic traits so each pet looks unique.

**Acceptance Criteria:**
- [ ] Base 3D model (low-poly for performance)
- [ ] Material/texture system for color traits
- [ ] Procedural generation of patterns based on trait values
- [ ] Accessory attachment system (hats, scarves, etc.) for rare traits
- [ ] Model loads in < 2 seconds on web, < 1 second in AR
- [ ] Supports GLTF/GLB format
- [ ] Typecheck passes

### US-027: Admin Dashboard for Skill Management
**Description:** As an admin, I want to add new skills to the marketplace so users have growing content.

**Acceptance Criteria:**
- [ ] Admin-only route for skill creation
- [ ] Form: skill name, category, description, price, icon upload, system prompt addition
- [ ] Skill activation toggle (enable/disable without deleting)
- [ ] View purchase analytics per skill
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-028: Error Logging and Monitoring
**Description:** As a developer, I need comprehensive error logging so I can debug production issues.

**Acceptance Criteria:**
- [ ] Integration with Sentry or similar error tracking
- [ ] Log all LLM API failures with context
- [ ] Log AR session crashes
- [ ] Log payment failures with anonymized user data
- [ ] Performance monitoring for critical paths (pet load time, breeding calculation)
- [ ] Alert on error rate > 5% of requests
- [ ] Typecheck passes

### US-029: Onboarding Tutorial
**Description:** As a new user, I want a brief tutorial so I understand how to care for my pet.

**Acceptance Criteria:**
- [ ] 5-step interactive tutorial on first login
- [ ] Steps: Create pet, Feed, Chat, View stats, Learn about breeding
- [ ] Skippable but prompted to complete
- [ ] Tutorial reward (starter skill or currency)
- [ ] Progress saved (can resume later)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-030: Data Privacy and GDPR Compliance
**Description:** As a user, I want my data to be private and manageable so I feel safe using the app.

**Acceptance Criteria:**
- [ ] Privacy policy and terms of service pages
- [ ] Cookie consent banner (EU users)
- [ ] Data export feature (download all user data as JSON)
- [ ] Account deletion feature (with confirmation flow)
- [ ] All LLM conversations encrypted at rest
- [ ] No data sold to third parties
- [ ] COPPA compliance for users under 13 (age gate)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

**FR-1:** The system must support user registration via email/password and OAuth (Google, Apple).

**FR-2:** Each pet must have genetic traits stored across 4 rarity tiers: Common (60%), Uncommon (25%), Rare (10%), Legendary (5%).

**FR-3:** Pet stats (Health, Hunger, Happiness, Energy) must degrade automatically over time based on specified rates.

**FR-4:** The system must send warning notifications when pet stats reach critical thresholds (Hunger > 80, Health < 30).

**FR-5:** Pets must enter a "Critical" recovery state instead of dying when Health reaches 0.

**FR-6:** All pets must be powered by GPT-4o-mini with personality-driven system prompts.

**FR-7:** Pet memory must use hybrid storage: full detail for last 50 interactions, summarized for older interactions.

**FR-8:** Breeding must combine parent traits using 50/50 inheritance with 15% mutation chance per trait.

**FR-9:** The skill marketplace must support real-money purchases via Stripe (web), Apple IAP (iOS), and Google Play Billing (Android).

**FR-10:** Teaching skills must modify LLM system prompts to enable domain-specific conversational teaching.

**FR-11:** The web app must display pet 3D models with trait-based variations (color, patterns, accessories).

**FR-12:** AR mode must render pets in the user's environment using WebXR or native AR frameworks.

**FR-13:** All pet state changes must sync between web and AR platforms within 5 seconds.

**FR-14:** Users must be able to own up to 10 pets and switch between them.

**FR-15:** Friend system must allow breeding requests between users' pets with approval flow.

**FR-16:** Daily engagement must provide login bonuses and track user streaks.

**FR-17:** Admin dashboard must allow creation and management of marketplace skills.

**FR-18:** All LLM conversations must be encrypted at rest and comply with GDPR/COPPA.

**FR-19:** The system must handle LLM API failures gracefully with fallback messages.

**FR-20:** AR sessions must maintain 30+ FPS on target devices (iPhone 11+, Android flagship from 2020+).

## Non-Goals (Out of Scope for MVP)

- **No PvP battles or competitive modes** - Focus is on care and education, not competition
- **No advanced lesson structures** - Teaching is conversational only, no quizzes or progress tracking
- **No NFT integration** - Pets are not blockchain-based assets
- **No pet trading/selling between users** - Only breeding collaboration
- **No generation-locked traits** - Unlike forkMonkey, all traits remain available across generations
- **No multi-language support** - English only for MVP
- **No web3/cryptocurrency payments** - Traditional payment methods only
- **No facial recognition** - Removed from AI-Pet scope due to privacy concerns and complexity
- **No real-time emotion detection** - Conversational AI only, no camera-based emotion analysis
- **No breeding marketplace** - Users can only breed with friends' pets, not strangers
- **No pet customization post-creation** - Traits are genetic only, no cosmetic store
- **No voice synthesis for pet** - Text responses only in MVP, voice can be added later

## Design Considerations

### UI/UX Requirements

**Web App:**
- Clean, modern interface targeting teens (bold colors, smooth animations)
- Mobile-responsive design (works on phones, tablets, desktop)
- Dashboard-centric layout with pet front and center
- Quick action buttons: Feed, Play, Chat, Breed
- Stats displayed as progress bars with color coding
- Dark mode support

**AR Experience:**
- Minimal UI overlay (stats, feed button, chat activation)
- Pet scaled appropriately (30-50cm tall in AR)
- Surface detection with clear placement indicator
- Smooth animations synchronized with audio
- Clear exit button and session timer

**Marketplace:**
- Card-based layout for skill browsing
- Clear pricing and skill descriptions
- Preview feature (show what pet will say/do with skill)
- Secure checkout flow with clear refund policy

**Accessibility:**
- WCAG 2.1 AA compliance
- Screen reader support for web app
- High contrast mode option
- Text size adjustments

### Existing Components to Reuse

- Consider using existing 3D libraries: Three.js (web), AR.js (WebXR), ARCore/ARKit (native)
- Leverage Stripe Elements for payment UI
- Use established chat UI libraries (react-chat-elements, stream-chat-react)
- Genetic algorithm libraries for breeding calculations

## Technical Considerations

### Architecture

**Frontend:**
- Web: React or Next.js with TypeScript
- AR: React Native with AR libraries or Unity WebGL export
- State management: Redux or Zustand
- Real-time updates: WebSocket or Supabase Realtime

**Backend:**
- Node.js/Express or Python/FastAPI
- PostgreSQL database for relational data (users, pets, traits, skills)
- Redis for session management and caching
- OpenAI API integration for GPT-4o-mini
- Background job processing: Bull/BullMQ or Celery

**Infrastructure:**
- Hosting: Vercel/Netlify (frontend), Railway/Render/AWS (backend)
- File storage: AWS S3 or Cloudinary (pet images, 3D models)
- CDN for 3D model delivery
- Monitoring: Sentry, LogRocket, or Datadog

### Performance Requirements

- Page load time < 3 seconds on 4G connection
- LLM response time < 3 seconds for text
- AR model load time < 1 second
- Database queries < 100ms for pet data retrieval
- Support 10,000 concurrent users

### Security

- JWT authentication with refresh tokens
- HTTPS only
- Input validation and sanitization for all LLM prompts
- Rate limiting on API endpoints (prevent abuse)
- PCI DSS compliance for payment processing
- Encrypted storage for sensitive data

### Scalability

- Horizontal scaling for API servers
- Database read replicas for heavy read operations
- Caching layer for frequently accessed pet data
- CDN for static assets and 3D models
- Queue system for background jobs (stat degradation, memory summarization)

### Third-Party Integrations

- **OpenAI API** - GPT-4o-mini for pet intelligence
- **Stripe** - Payment processing (web)
- **Apple IAP** - iOS purchases
- **Google Play Billing** - Android purchases
- **WebXR/ARCore/ARKit** - Augmented reality
- **SendGrid/Postmark** - Transactional emails
- **Firebase Cloud Messaging** - Push notifications

## Success Metrics

### User Engagement
- Daily Active Users (DAU) / Monthly Active Users (MAU) ratio > 0.3
- Average session duration > 10 minutes
- User retention: 40% Day 7, 20% Day 30
- Average interactions per pet per day > 5

### Monetization
- Conversion rate to paying user > 5%
- Average revenue per paying user (ARPPU) > $10 in first month
- Skill marketplace: 2+ skill purchases per paying user

### Technical Performance
- 99.5% uptime
- LLM API success rate > 98%
- AR session completion rate > 90% (users don't quit early)
- Payment success rate > 95%

### Educational Impact
- Users with teaching skills engage 50% longer per session
- Positive user feedback on conversational teaching (>4/5 stars)

### Breeding & Genetics
- 30% of users breed at least one pet within first month
- Average 3 generations of pets per active user at 60 days

## Open Questions

1. **Should we implement a "stamina" system for interactions to prevent users from spamming the LLM and driving up costs?**
   - Option A: 100 messages per day per pet
   - Option B: Energy-based system (each chat costs pet energy)
   - Option C: No limit for MVP, monitor costs

2. **How should we handle friend breeding when one pet is significantly higher generation?**
   - Does generation gap matter for breeding eligibility?
   - Should offspring generation be average or max+1?

3. **What happens to a pet's skills when it breeds? Are skills genetic?**
   - Option A: Skills are not inherited (each pet must purchase own)
   - Option B: 25% chance to inherit parent's skills
   - Option C: Offspring gets "Apprentice" version of parent skills (weaker)

4. **Should AR and web experiences have feature parity or can AR be more limited?**
   - Current assumption: AR has core features (view, feed, chat) but breeding/marketplace only on web

5. **How do we prevent users from exploiting the recovery system (letting pet get critical, recover, repeat)?**
   - Consider recovery cooldown or escalating costs
   - Permanent stat reduction after multiple recoveries?

6. **What's the refund policy for skill purchases?**
   - Industry standard: No refunds for digital goods
   - Or grace period (1 hour to request refund if not used)?

7. **Should we allow users to "release" pets (delete them)?**
   - If yes, what happens to breeding history/lineage?
   - Should released pets go to a "adoption center" for other users?

8. **How should we handle timezone differences for daily rewards?**
   - Use user's local timezone or UTC?
   - Can users game the system by changing timezones?

9. **What's the minimum viable 3D model quality?**
   - Low-poly stylized vs semi-realistic?
   - Budget for 3D artist or use procedural generation?

10. **Should we implement content moderation for pet names and user conversations?**
    - Profanity filter for names
    - LLM safety filters already in place, but monitor for prompt injection attempts

---

## Next Steps

1. **Technical Spike:** Evaluate AR frameworks (WebXR vs React Native vs Unity) - 3 days
2. **Design Sprint:** Create mockups for web dashboard, AR experience, marketplace - 5 days
3. **Backend Architecture:** Design database schema, API structure, job queue system - 3 days
4. **LLM Prompt Engineering:** Develop personality-driven system prompts and test with GPT-4o-mini - 2 days
5. **Cost Analysis:** Estimate OpenAI API costs, hosting costs, payment processing fees - 1 day
6. **Legal Review:** Draft privacy policy, terms of service, ensure COPPA/GDPR compliance - 3 days
7. **Development Roadmap:** Break user stories into 2-week sprints - 1 day

**Estimated MVP Timeline:** 16-20 weeks with team of 3-4 developers (1 frontend, 1 backend, 1 AR specialist, 1 full-stack)
