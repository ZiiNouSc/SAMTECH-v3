import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  IconButton,
  Drawer,
  Navbar,
  Button,
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from '@material-tailwind/react';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CogIcon,
  PowerIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  DocumentIcon,
  TicketIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
  ShieldCheckIcon,
  CubeIcon,
  BookOpenIcon,
  PhoneIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  module?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: HomeIcon,
    path: '/dashboard',
  },
  {
    label: 'Clients',
    icon: UserGroupIcon,
    path: '/clients',
    module: 'clients',
  },
  {
    label: 'Fournisseurs',
    icon: BuildingOfficeIcon,
    path: '/fournisseurs',
    module: 'fournisseurs',
  },
  {
    label: 'Factures',
    icon: DocumentTextIcon,
    path: '/factures',
    children: [
      { label: 'Factures clients', icon: DocumentTextIcon, path: '/factures' },
      { label: 'Factures fournisseurs', icon: DocumentTextIcon, path: '/factures-fournisseurs' },
      { label: 'Devis', icon: DocumentIcon, path: '/pre-factures', module: 'pre-factures' },
    ],
  },
  {
    label: 'Réservations',
    icon: TicketIcon,
    path: '/reservations',
    module: 'reservations',
    children: [
      { label: 'Billets', icon: TicketIcon, path: '/billets', module: 'billets' },
      { label: 'Hôtels', icon: BuildingOfficeIcon, path: '/hotels' },
      { label: 'Visas', icon: DocumentIcon, path: '/visas' },
      { label: 'Assurances', icon: ShieldCheckIcon, path: '/assurances' },
      { label: 'Manifests', icon: ClipboardDocumentListIcon, path: '/manifests' },
    ],
  },
  {
    label: 'Caisse',
    icon: CurrencyDollarIcon,
    path: '/caisse',
    module: 'caisse',
  },
  {
    label: 'Créances',
    icon: CreditCardIcon,
    path: '/creances',
    module: 'creances',
  },
  {
    label: 'Packages',
    icon: CubeIcon,
    path: '/packages',
    module: 'packages',
  },
  {
    label: 'CRM',
    icon: PhoneIcon,
    path: '/crm',
    module: 'crm',
  },
  {
    label: 'Outils',
    icon: CogIcon,
    path: '/outils',
    children: [
      { label: 'Calendrier', icon: CalendarIcon, path: '/calendrier', module: 'calendrier' },
      { label: 'Tâches', icon: ClipboardDocumentCheckIcon, path: '/todos', module: 'todos' },
      { label: 'Documents', icon: DocumentIcon, path: '/documents', module: 'documents' },
      { label: 'Tickets', icon: TicketIcon, path: '/tickets' },
    ],
  },
  {
    label: 'Rapports',
    icon: ChartBarIcon,
    path: '/rapports',
  },
  {
    label: 'Administration',
    icon: CogIcon,
    path: '/admin',
    children: [
      { label: 'Agents', icon: UsersIcon, path: '/agents' },
      { label: 'Agences', icon: BuildingOfficeIcon, path: '/agences' },
      { label: 'Paramètres', icon: CogIcon, path: '/parametres' },
      { label: 'Audit', icon: ClipboardDocumentListIcon, path: '/audit' },
    ],
  },
];

const ArgonLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { user, logout, currentAgence } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canAccessModule = (module?: string) => {
    if (!module) return true;
    return currentAgence?.modulesActifs?.includes(module) || user?.role === 'superadmin';
  };

  const filteredMenuItems = menuItems.filter(item => canAccessModule(item.module));

  const SidebarContent = () => (
    <Card className="h-full w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5">
      <div className="mb-2 flex items-center gap-4 p-4">
        <img 
          src="/src/samtech.png" 
          alt="SamTech"
          className="h-8 w-8"
        />
        <Typography variant="h5" color="blue-gray">
          SamTech
        </Typography>
      </div>
      <List>
        {filteredMenuItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <ListItem
                  onClick={() => handleSubmenu(item.label)}
                  className={`p-3 ${openSubmenu === item.label ? 'bg-blue-50' : ''}`}
                >
                  <ListItemPrefix>
                    <item.icon className="h-5 w-5" />
                  </ListItemPrefix>
                  {item.label}
                </ListItem>
                {openSubmenu === item.label && (
                  <div className="ml-4">
                    {item.children
                      .filter(child => canAccessModule(child.module))
                      .map((child) => (
                        <ListItem
                          key={child.path}
                          onClick={() => {
                            window.location.href = child.path;
                            closeSidebar();
                          }}
                          className={`p-2 text-sm ${
                            isActiveRoute(child.path) ? 'bg-blue-500 text-white' : ''
                          }`}
                        >
                          <ListItemPrefix>
                            <child.icon className="h-4 w-4" />
                          </ListItemPrefix>
                          {child.label}
                        </ListItem>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <ListItem
                onClick={() => {
                  window.location.href = item.path;
                  closeSidebar();
                }}
                className={`p-3 ${
                  isActiveRoute(item.path) ? 'bg-blue-500 text-white' : ''
                }`}
              >
                <ListItemPrefix>
                  <item.icon className="h-5 w-5" />
                </ListItemPrefix>
                {item.label}
              </ListItem>
            )}
          </div>
        ))}
      </List>
      <div className="mt-auto p-4">
        <ListItem onClick={logout} className="p-3 text-red-500">
          <ListItemPrefix>
            <PowerIcon className="h-5 w-5" />
          </ListItemPrefix>
          Déconnexion
        </ListItem>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IconButton
              variant="text"
              className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
              ripple={false}
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? (
                <XMarkIcon className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Bars3Icon className="h-6 w-6" strokeWidth={2} />
              )}
            </IconButton>
            <Typography variant="h6" className="mr-4 cursor-pointer py-1.5">
              {currentAgence?.nom || 'SamTech'}
            </Typography>
          </div>
          
          <div className="flex items-center gap-4">
            <IconButton variant="text" size="sm">
              <BellIcon className="h-4 w-4" />
            </IconButton>
            
            <Menu>
              <MenuHandler>
                <Button variant="text" className="flex items-center gap-2 p-2">
                  <Avatar
                    size="sm"
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.prenom}+${user?.nom}&background=0ea5e9&color=fff`}
                    alt={`${user?.prenom} ${user?.nom}`}
                  />
                  <div className="text-left">
                    <Typography variant="small" className="font-medium">
                      {user?.prenom} {user?.nom}
                    </Typography>
                    <Typography variant="small" color="gray" className="text-xs">
                      {user?.role}
                    </Typography>
                  </div>
                </Button>
              </MenuHandler>
              <MenuList>
                <MenuItem onClick={() => window.location.href = '/profile'}>
                  Profil
                </MenuItem>
                <MenuItem onClick={() => window.location.href = '/parametres'}>
                  Paramètres
                </MenuItem>
                <hr className="my-2 border-blue-gray-50" />
                <MenuItem onClick={logout} className="text-red-500">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Déconnexion
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        </div>
      </Navbar>

      <div className="flex">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block lg:w-64">
          <SidebarContent />
        </div>

        {/* Sidebar Mobile */}
        <Drawer open={isSidebarOpen} onClose={closeSidebar} className="lg:hidden">
          <SidebarContent />
        </Drawer>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ArgonLayout; 