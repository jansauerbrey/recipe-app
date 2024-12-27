import React from 'react';
import { Title, Text, Stack, Container } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={1}>Welcome{user?.username ? `, ${user.username}` : ''}</Title>
        <Text size="lg" c="dimmed">
          This is your recipe planner dashboard. Start by browsing your recipes or creating a new one.
        </Text>
      </Stack>
    </Container>
  );
};
