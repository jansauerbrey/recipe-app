import { Group, Title } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Group justify="space-between" p="md">
      <Title order={3}>Recipe Planner</Title>
      <Group>
        {isAuthenticated && (
          <Group>
            <span>Welcome, {user?.username || user?.email}</span>
          </Group>
        )}
      </Group>
    </Group>
  );
}
