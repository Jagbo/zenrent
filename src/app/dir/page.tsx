import Link from "next/link";

interface Route {
  path: string;
  name: string;
  isDynamic?: boolean;
}

export default function DirectoryPage() {
  const routesByFolder: Record<string, Route[]> = {
    Root: [{ path: "/", name: "Home" }],
    Dashboard: [{ path: "/dashboard", name: "Dashboard" }],
    Properties: [
      { path: "/properties", name: "Properties" },
      { path: "/properties/[id]", name: "Property Details", isDynamic: true },
    ],
    Residents: [
      { path: "/residents", name: "Residents" },
      { path: "/residents/[id]", name: "Resident Details", isDynamic: true },
    ],
    Issues: [{ path: "/issues", name: "Issues" }],
    Financial: [{ path: "/financial", name: "Financial" }],
    Calendar: [{ path: "/calendar", name: "Calendar" }],
    Suppliers: [{ path: "/suppliers", name: "Suppliers" }],
    Authentication: [{ path: "/login", name: "Login" }],
    "Sign Up": [
      { path: "/sign-up", name: "Sign Up" },
      { path: "/sign-up/account-creation", name: "Account Creation" },
      { path: "/sign-up/email-verification", name: "Email Verification" },
    ],
    Onboarding: [
      { path: "/onboarding", name: "Onboarding" },
      { path: "/onboarding/landlord", name: "Landlord Onboarding" },
      {
        path: "/onboarding/landlord/personal-profile",
        name: "Personal Profile",
      },
      { path: "/onboarding/landlord/company-profile", name: "Company Profile" },
      { path: "/onboarding/landlord/tax-information", name: "Tax Information" },
      { path: "/onboarding/tenant", name: "Tenant Onboarding" },
      { path: "/onboarding/tenant/import-options", name: "Import Options" },
      { path: "/onboarding/tenant/tenancy-setup", name: "Tenancy Setup" },
      { path: "/onboarding/tenant/confirmation", name: "Confirmation" },
      { path: "/onboarding/tenant/complete", name: "Complete" },
      { path: "/onboarding/property", name: "Property Setup" },
      { path: "/onboarding/property/import-options", name: "Import Options" },
      { path: "/onboarding/property/add-property", name: "Add Property" },
      { path: "/onboarding/property/financial", name: "Financial Setup" },
      { path: "/onboarding/property/media", name: "Media Upload" },
      { path: "/onboarding/property/compliance", name: "Compliance" },
      { path: "/onboarding/setup", name: "Account Setup" },
      { path: "/onboarding/account-creation", name: "Account Creation" },
    ],
    Settings: [{ path: "/settings", name: "Settings" }],
    Billing: [
      { path: "/billing", name: "Billing" },
      { path: "/billing/payment", name: "Payment" },
    ],
    Integrations: [{ path: "/integrations", name: "Integrations" }],
    Development: [
      { path: "/supabase-test", name: "Supabase Test" },
      { path: "/sidebar-demo", name: "Sidebar Demo" },
      { path: "/dir/icon", name: "Icon Directory" },
      { path: "/dir/colour", name: "Colour Directory" },
    ],
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Application Directory</h1>
      <div className="space-y-8">
        {Object.entries(routesByFolder).map(([folder, routes]) => (
          <div key={folder} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {folder}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route) => (
                <a key={route.path}
                  href={route.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 border rounded-md hover:bg-gray-50 transition-colors block ${
                    route.path.split("/").length > 3 ? "ml-4" : ""
                  }`}
                >
                  <div className="font-medium">{route.name}</div>
                  <div className="text-sm text-gray-500">
                    {route.path}
                    {route.isDynamic && (
                      <span className="ml-2 text-xs text-blue-500">
                        (dynamic route)
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
