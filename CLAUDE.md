# Claude Instructions for ZenRent Project

## Project Overview
ZenRent is a comprehensive property management platform built with Next.js that helps landlords manage their rental properties, tenants, finances, and tax obligations.

## Key Technologies
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with social providers
- **Styling**: Tailwind CSS
- **Payment Processing**: Stripe
- **External APIs**: HMRC MTD, WhatsApp Business, Plaid, Google Calendar
- **Testing**: Jest, Playwright

## Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm test          # Run tests
```

## Project Structure
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/` - Reusable React components
- `/src/lib/` - Utilities, services, and business logic
- `/supabase/` - Database migrations and functions
- `/public/` - Static assets

## Important Guidelines

### Code Style
- Use TypeScript for all new files
- Follow existing patterns in the codebase
- No unnecessary comments unless requested
- Maintain consistent indentation and formatting

### Database Operations
- All database queries go through Supabase client
- Use Row Level Security (RLS) policies
- Handle errors gracefully with proper error messages

### API Routes
- Follow RESTful conventions
- Always validate input data
- Return appropriate status codes
- Include error handling

### Security
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate and sanitize all user inputs
- Follow OWASP security best practices

### Testing
- Write tests for new features
- Run tests before committing changes
- Use meaningful test descriptions

### HMRC Integration
- Handle OAuth flow securely
- Store tokens encrypted in database
- Include fraud prevention headers
- Follow MTD compliance requirements

### WhatsApp Integration
- Manage opt-in/opt-out preferences
- Handle webhook verification
- Store message history appropriately

## Common Tasks

### Adding a New Feature
1. Check existing patterns in similar features
2. Create necessary database tables/columns
3. Implement API routes with proper validation
4. Build UI components following design system
5. Add appropriate tests
6. Update any affected documentation

### Debugging Issues
1. Check browser console for client-side errors
2. Check API route logs for server-side errors
3. Verify database queries and RLS policies
4. Test with different user roles/permissions

### Performance Optimization
- Use React.lazy() for code splitting
- Implement proper caching strategies
- Optimize database queries
- Use appropriate image formats and sizes

## Environment Variables
Key environment variables needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `HMRC_CLIENT_ID`
- `HMRC_CLIENT_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Current Focus Areas
- Tax filing and HMRC integration
- WhatsApp messaging for tenant communication
- Subscription management with Stripe
- Property enrichment with external data sources