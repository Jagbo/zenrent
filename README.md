# ZenRent - Property Management System

## Project Overview

ZenRent is a comprehensive property management platform designed to revolutionize how landlords and property managers handle their real estate portfolios. Built with modern technology and user experience in mind, ZenRent streamlines every aspect of property management - from tenant communication to maintenance tracking and financial management.

### Why ZenRent?

- **Simplified Property Management**: Manage your entire property portfolio from a single, intuitive dashboard
- **Time-Saving Automation**: Automate rent collection, maintenance requests, and tenant communications
- **Enhanced Communication**: Built-in WhatsApp integration and tenant portal for seamless interaction
- **Data-Driven Insights**: Track property performance, financial metrics, and maintenance patterns
- **Scalable Solution**: From single property owners to large portfolio managers, our tiered pricing fits your needs

### Key Differentiators

- **HMO Support**: Specialized features for Houses in Multiple Occupation (HMO) management
- **Real-Time Updates**: Live notifications and status tracking for maintenance issues
- **Secure & Compliant**: Built on enterprise-grade infrastructure with row-level security
- **Mobile-First Design**: Manage your properties on the go with our responsive interface
- **AI-Powered Features**: Advanced analytics and automated insights for Professional plan users

ZenRent is a modern, full-featured property management system built with Next.js that helps property managers and owners streamline their operations. The system provides comprehensive tools for managing properties, tenants, maintenance requests, and financial transactions.

## Pricing Plans

### Essential Plan
**£10 per month** (£96/year with annual billing)
- For landlords managing 1-2 properties
- Full access to core property management features
- Basic tenant portal access
- Basic financial reporting
- Email support

### Standard Plan
**£20 per month** (£192/year with annual billing)
- For landlords managing 2-10 properties
- All Essential features plus advanced reporting
- Full HMO property support
- Enhanced tenant portal
- Email & chat support

### Professional Plan
**£30 per month** (£288/year with annual billing)
- For landlords managing 10+ properties
- All Standard features plus priority support
- Enhanced analytics and customization options
- Premium tenant portal
- Priority support
- Full AI feature access

Save 20% with annual billing on all plans!

## Features

- **Property Management**
  - Track multiple properties and units
  - HMO property support (Standard & Professional plans)
  - Resident information management
  - Document storage and management
  - Property performance analytics

- **Maintenance Issue Tracking**
  - Create and manage maintenance requests
  - Prioritize issues (Low, Medium, High)
  - Track issue status (Todo, In Progress, Backlog, Done)
  - Assign issues to team members
  - Attach images and documentation
  - Filter and search capabilities
  - Board and list views for issue management

- **Financial Management**
  - Rent collection and tracking
  - Expense management
  - Financial reporting
  - Service charge handling
  - Automated payment reminders

- **Communication Tools**
  - WhatsApp integration
  - Tenant portal
  - Automated notifications
  - Document sharing
  - Maintenance request communication

- **Modern UI/UX**
  - Responsive design
  - Dark/light mode support
  - Interactive dashboards
  - Real-time updates
  - Drag-and-drop interfaces

- **Tax Integration**: HMRC MTD (Making Tax Digital) integration for automated tax submissions

## HMRC Integration

ZenRent integrates with HMRC's Making Tax Digital (MTD) API for automated tax submissions. The integration supports both sandbox (development) and production environments:

### Environment Configuration

- **Development Mode**: Automatically uses HMRC sandbox environment (`test-api.service.hmrc.gov.uk`)
- **Production Mode**: Uses HMRC production environment (`api.service.hmrc.gov.uk`)

### Environment Variables

```bash
# HMRC Configuration
HMRC_CLIENT_ID=your_client_id
HMRC_CLIENT_SECRET=your_client_secret
HMRC_REDIRECT_URI=your_callback_url
HMRC_AUTH_URL=https://test-api.service.hmrc.gov.uk/oauth/authorize  # Sandbox
HMRC_TOKEN_URL=https://test-api.service.hmrc.gov.uk/oauth/token     # Sandbox

# Optional: Force mock data instead of real API calls
HMRC_USE_MOCK_DATA=false  # Set to 'true' to use mock data instead of sandbox/production APIs
```

### Testing Tax Submissions

In development mode, tax submissions will:
1. Use HMRC's sandbox environment for real API testing
2. Submit actual test data to HMRC's test servers
3. Receive real sandbox responses and calculation IDs
4. Allow full end-to-end testing of the MTD integration

To use mock data instead of sandbox APIs, set `HMRC_USE_MOCK_DATA=true` in your environment.

## Technology Stack

- **Frontend**
  - Next.js 14+ (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Headless UI Components
  - Hero Icons

- **Backend**
  - Supabase
  - PostgreSQL with Row Level Security
  - Real-time subscriptions
  - Secure authentication

## Getting Started

1. **Prerequisites**
   - Node.js 18+ 
   - npm or yarn or pnpm or bun
   - Supabase account for backend services

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/zenrent.git
   
   # Navigate to project directory
   cd zenrent
   
   # Install dependencies
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Development**
   ```bash
   # Start the development server
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
zenrent/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── components/      # Reusable UI components
│   │   ├── issues/         # Issues management pages
│   │   ├── sign-up/        # Authentication pages
│   │   └── ...
│   ├── components/         # Shared components
│   └── ...
├── public/                 # Static files
│   ├── images/            # Image assets
│   └── ...
└── ...
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support:
- Open an issue in the GitHub repository
- Contact our support team:
  - Essential Plan: Email support
  - Standard Plan: Email & chat support
  - Professional Plan: Priority support on all channels

---

Built with ❤️ using [Next.js](https://nextjs.org/) and powered by [Supabase](https://supabase.com/).
