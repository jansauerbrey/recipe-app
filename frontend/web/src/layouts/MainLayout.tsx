import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, Container } from '@mantine/core';
import { NavigationSidebar } from '../components/navigation/NavigationSidebar';
import { Navbar } from '../components/navigation/Navbar';

export const MainLayout: React.FC = () => {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false }
      }}
    >
      <AppShell.Header withBorder>
        <Navbar opened={opened} setOpened={setOpened} />
      </AppShell.Header>

      <AppShell.Navbar withBorder>
        <NavigationSidebar setOpened={setOpened} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};
