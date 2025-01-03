import { NavLink, useLocation } from 'react-router-dom';
import { AppShellNavbar, UnstyledButton, Stack, rem, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconHome,
  IconChefHat,
  IconCalendar,
  IconShoppingCart,
  IconSettings,
  IconRuler,
  IconApple,
  IconTags,
  IconBowl,
  IconUsers,
  IconCategory,
  IconLogout,
  IconLogin,
  IconUserPlus,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavLinkItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}

interface NavbarLinkProps extends NavLinkItem {}

function NavbarLink({ icon, label, to, onClick }: NavbarLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <UnstyledButton
      component={NavLink}
      to={to}
      onClick={onClick}
      style={(theme) => ({
        width: '100%',
        height: rem(40),
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        textDecoration: 'none',
        fontSize: theme.fontSizes.sm,
        fontWeight: 500,
        borderRadius: theme.radius.sm,
        backgroundColor: isActive ? theme.colors.blue[0] : 'transparent',
        color: isActive ? theme.colors.blue[7] : theme.colors.gray[7],
        '&:hover': {
          backgroundColor: isActive ? theme.colors.blue[0] : theme.colors.gray[0],
        },
      })}
    >
      {icon}
      <Box ml={rem(12)}>{label}</Box>
    </UnstyledButton>
  );
}

interface NavigationSidebarProps {
  setOpened: (opened: boolean) => void;
}

export function NavigationSidebar({ setOpened }: NavigationSidebarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const userLinks: NavLinkItem[] = [
    { icon: <IconHome size="1.2rem" stroke={1.5} />, label: 'Home', to: '/' },
    { icon: <IconChefHat size="1.2rem" stroke={1.5} />, label: 'Recipes', to: '/recipes' },
    { icon: <IconCalendar size="1.2rem" stroke={1.5} />, label: 'Schedules', to: '/schedules' },
    { icon: <IconShoppingCart size="1.2rem" stroke={1.5} />, label: 'Shopping', to: '/shopping' },
    { icon: <IconSettings size="1.2rem" stroke={1.5} />, label: 'Settings', to: '/settings' },
  ];

  const adminLinks: NavLinkItem[] = [
    { icon: <IconRuler size="1.2rem" stroke={1.5} />, label: 'Units', to: '/admin/units' },
    { icon: <IconApple size="1.2rem" stroke={1.5} />, label: 'Ingredients', to: '/admin/ingredients' },
    { icon: <IconCategory size="1.2rem" stroke={1.5} />, label: 'Categories', to: '/admin/categories' },
    { icon: <IconTags size="1.2rem" stroke={1.5} />, label: 'Tags', to: '/admin/tags' },
    { icon: <IconBowl size="1.2rem" stroke={1.5} />, label: 'Dish Types', to: '/admin/dishtypes' },
    { icon: <IconUsers size="1.2rem" stroke={1.5} />, label: 'Users', to: '/admin/users' },
  ];

  const authLinks: NavLinkItem[] = isAuthenticated ? [
    { icon: <IconLogout size="1.2rem" stroke={1.5} />, label: 'Logout', to: '/logout', onClick: logout }
  ] : [
    { icon: <IconLogin size="1.2rem" stroke={1.5} />, label: 'Login', to: '/login' },
    { icon: <IconUserPlus size="1.2rem" stroke={1.5} />, label: 'Register', to: '/register' }
  ];

  const dividerStyle = (theme: any) => ({
    borderTop: `${rem(1)} solid ${theme.colors.gray[2]}`,
    margin: `${theme.spacing.sm} 0`,
  });

  return (
    <AppShellNavbar>
      <Stack gap={0} p="md">
        {/* User Links */}
        {isAuthenticated && userLinks.map((link) => (
          <NavbarLink 
            key={link.label} 
            {...link} 
            onClick={() => {
              link.onClick?.();
              if (isMobile) {
                setOpened(false);
              }
            }}
          />
        ))}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <Box style={dividerStyle} />
            {adminLinks.map((link) => (
              <NavbarLink 
                key={link.label} 
                {...link}
                onClick={() => {
                  link.onClick?.();
                  if (isMobile) {
                    setOpened(false);
                  }
                }}
              />
            ))}
          </>
        )}

        {/* Auth Links */}
        <Box style={dividerStyle} />
        {authLinks.map((link) => (
          <NavbarLink 
            key={link.label} 
            {...link}
            onClick={() => {
              link.onClick?.();
              if (isMobile) {
                setOpened(false);
              }
            }}
          />
        ))}

        {/* Footer Links */}
        <Box style={dividerStyle} />
        <NavbarLink
          icon={<IconInfoCircle size="1.2rem" stroke={1.5} />}
          label="Impressum"
          to="/impressum"
          onClick={() => {
            if (isMobile) {
              setOpened(false);
            }
          }}
        />
      </Stack>
    </AppShellNavbar>
  );
}
