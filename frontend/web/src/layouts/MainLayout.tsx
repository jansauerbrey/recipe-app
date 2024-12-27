import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, Container } from '@mantine/core';
import { NavigationSidebar } from '../components/navigation/NavigationSidebar';
import { Navbar } from '../components/navigation/Navbar';

export const MainLayout: React.FC = () => {
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
    >
      <AppShell.Header withBorder>
        <Navbar />
      </AppShell.Header>

      <AppShell.Navbar withBorder>
        <NavigationSidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
