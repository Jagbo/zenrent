import { Avatar } from '@/components/avatar'
import { Sidebar, SidebarBody, SidebarFooter, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection } from '@/components/sidebar'
import { ChevronRightIcon } from '@heroicons/react/16/solid'
import { Cog6ToothIcon, HomeIcon, MegaphoneIcon, Square2StackIcon, TicketIcon } from '@heroicons/react/20/solid'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'

function Example() {
  return (
    <Sidebar>
      <SidebarBody>
        <SidebarSection>
          <SidebarItem href="/">
            <HomeIcon />
            <SidebarLabel>Home</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/events">
            <Square2StackIcon />
            <SidebarLabel>Events</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/orders">
            <TicketIcon />
            <SidebarLabel>Orders</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/broadcasts">
            <MegaphoneIcon />
            <SidebarLabel>Broadcasts</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/settings">
            <Cog6ToothIcon />
            <SidebarLabel>Settings</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
        
        <SidebarSection className="mt-6">
          <SidebarHeading>Properties</SidebarHeading>
          <SidebarItem href="/properties/riverdale-apartments">
            <BuildingOffice2Icon className="h-5 w-5" />
            <SidebarLabel>Riverdale Apartments</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/properties/sunset-heights">
            <BuildingOffice2Icon className="h-5 w-5" />
            <SidebarLabel>Sunset Heights</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/properties/oakwood-residences">
            <BuildingOffice2Icon className="h-5 w-5" />
            <SidebarLabel>Oakwood Residences</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/properties/marina-bay-towers">
            <BuildingOffice2Icon className="h-5 w-5" />
            <SidebarLabel>Marina Bay Towers</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
      <SidebarFooter>
        <SidebarSection>
          <SidebarItem href="/profile">
            <Avatar 
              src="/profile-photo.jpg" 
              className="size-8 ring-2 ring-white dark:ring-zinc-800"
            />
            <div className="flex flex-col">
              <SidebarLabel>Erica</SidebarLabel>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">erica@example.com</span>
            </div>
            <ChevronRightIcon className="ml-auto h-5 w-5 text-zinc-400" />
          </SidebarItem>
        </SidebarSection>
      </SidebarFooter>
    </Sidebar>
  )
}

export default Example 