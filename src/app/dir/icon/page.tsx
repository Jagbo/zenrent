import React from "react";
import * as SolidIcons from "@heroicons/react/24/solid";
import * as OutlineIcons from "@heroicons/react/24/outline";
import * as MiniIcons from "@heroicons/react/20/solid";
import * as MicroIcons from "@heroicons/react/16/solid";

// Helper function to convert PascalCase to words with spaces
function formatIconName(name: string): string {
  // Remove 'Icon' suffix
  name = name.replace(/Icon$/, "");

  // Insert space before capital letters and trim
  return name.replace(/([A-Z])/g, " $1").trim();
}

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Define the icons used in the application by category
const usedIcons = {
  "24px Solid": [
    "CheckIcon",
    "XMarkIcon",
    "ChevronDownIcon",
    "PlusIcon",
    "ArrowLeftIcon",
    "RocketLaunchIcon",
    "ArrowRightIcon",
    "CreditCardIcon",
    "EllipsisHorizontalIcon",
    "PencilIcon",
    "MegaphoneIcon",
    "CheckCircleIcon",
    "BuildingOfficeIcon",
    "HomeIcon",
    "ArrowDownIcon",
    "FunnelIcon",
    "MagnifyingGlassIcon",
    "BuildingOffice2Icon",
  ],
  "24px Outline": [
    "XMarkIcon",
    "CheckIcon",
    "BellIcon",
    "EnvelopeIcon",
    "DevicePhoneMobileIcon",
    "PhotoIcon",
    "DocumentIcon",
    "VideoCameraIcon",
    "ArrowUpTrayIcon",
    "ArrowsUpDownIcon",
    "QuestionMarkCircleIcon",
    "PhoneIcon",
    "AcademicCapIcon",
    "HomeIcon",
    "BuildingOfficeIcon",
    "BuildingStorefrontIcon",
    "DocumentArrowDownIcon",
    "ExclamationCircleIcon",
    "ShieldCheckIcon",
    "UserCircleIcon",
    "MapPinIcon",
    "CalendarIcon",
    "CreditCardIcon",
    "LockClosedIcon",
    "TableCellsIcon",
    "PlusCircleIcon",
    "UserPlusIcon",
    "CheckCircleIcon",
    "InformationCircleIcon",
    "PlusIcon",
    "DocumentTextIcon",
    "BuildingOffice2Icon",
    "CurrencyDollarIcon",
    "UserGroupIcon",
    "KeyIcon",
    "Square2StackIcon",
    "Cog6ToothIcon",
  ],
  "20px Solid": [
    "MagnifyingGlassIcon",
    "PencilIcon",
    "ArrowLeftOnRectangleIcon",
    "Squares2X2Icon",
    "ListBulletIcon",
    "MegaphoneIcon",
    "ChevronRightIcon",
    "PaperClipIcon",
    "CheckIcon",
    "HandThumbUpIcon",
    "UserIcon",
    "EllipsisHorizontalIcon",
    "Cog6ToothIcon",
    "HomeIcon",
    "Square2StackIcon",
    "TicketIcon",
  ],
  "16px Solid": ["ChevronRightIcon"],
};

export default function IconsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Icon Directory</h1>
      <p className="mb-6 text-gray-600">
        This page displays all icons that are used across the application.
      </p>

      {Object.entries(usedIcons).map(([categoryName, iconNames]) => {
        let iconLib;
        switch (categoryName) {
          case "24px Solid":
            iconLib = SolidIcons;
            break;
          case "24px Outline":
            iconLib = OutlineIcons;
            break;
          case "20px Solid":
            iconLib = MiniIcons;
            break;
          case "16px Solid":
            iconLib = MicroIcons;
            break;
          default:
            iconLib = {};
        }

        return (
          <div key={categoryName} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">
              {categoryName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {iconNames.map((iconName) => {
                // Get the icon component directly from the library
                const IconComponent = iconLib[
                  iconName as keyof typeof iconLib
                ] as IconComponent | undefined;

                if (!IconComponent) {
                  return (
                    <div key={iconName}
                      className="p-4 border rounded-md bg-gray-50 flex flex-col items-center text-center opacity-50"
                    >
                      <div className="w-12 h-12 flex items-center justify-center text-red-500">
                        Not Found
                      </div>
                      <span className="text-sm font-medium mt-2">
                        {iconName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatIconName(iconName)}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={iconName}
                    className="p-4 border rounded-md hover:bg-gray-50 flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-black"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-sm font-medium mt-2">{iconName}</span>
                    <span className="text-xs text-gray-500">
                      {formatIconName(iconName)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-8 bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">
          Icon Usage in the Application
        </h3>
        <p className="text-sm text-gray-600">
          These icons are imported from Heroicons. To use an icon in your
          component:
        </p>
        <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto mt-2">
          <code>{`import { IconName } from '@heroicons/react/24/solid';
// or
import { IconName } from '@heroicons/react/24/outline';
// or 
import { IconName } from '@heroicons/react/20/solid';
// or
import { IconName } from '@heroicons/react/16/solid';

export default function MyComponent() {
  return (
    <div>
      <IconName className="w-5 h-5 text-black" />
      <span>Label</span>
    </div>
  );
}`}</code>
        </pre>
      </div>
    </div>
  );
}
