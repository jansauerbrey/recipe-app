import { Group, Title, Burger } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DishType, RECIPE_FILTERS } from '../../types/recipe';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';

const getTitleFromPath = (pathname: string, dishTypes: DishType[] | undefined): string => {
  // Check for recipe category routes
  if (pathname.startsWith('/recipes/')) {
    const identifier = pathname.split('/')[2];
    // Check both filters and dish types
    const filter = RECIPE_FILTERS.find(type => type.identifier === identifier);
    if (filter) {
      return filter.name.en;
    }
    const dishType = dishTypes?.find(type => type.identifier === identifier);
    if (dishType) {
      return dishType.name.en;
    }
  }

  const routes: Record<string, string> = {
    '/': 'Recipe Planner',
    '/recipes': 'Recipes',
    '/schedules': 'Schedules',
    '/shopping': 'Shopping List',
    '/settings': 'Settings',
    '/admin/units': 'Units',
    '/admin/ingredients': 'Ingredients',
    '/admin/tags': 'Tags',
    '/admin/dishtypes': 'Dish Types',
    '/admin/users': 'Users',
    '/login': 'Login',
    '/register': 'Register',
    '/impressum': 'Impressum'
  };

  return routes[pathname] || 'Recipe Planner';
};

interface NavbarProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

export function Navbar({ opened, setOpened }: NavbarProps) {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const { data: dishTypes } = useQuery<DishType[]>({
    queryKey: ['dishTypes'],
    queryFn: () => api.get('/dishtypes')
  });

  const title = getTitleFromPath(location.pathname, dishTypes);

  return (
    <Group justify="space-between" p="md">
      <Group>
        {isMobile ? (
          <Burger
            opened={opened}
            onClick={() => setOpened(!opened)}
            size="sm"
            aria-label="Toggle navigation"
          />
        ) : (
          <img 
            src="/icon.png" 
            alt="Recipe Planner" 
            style={{ height: '30px', width: 'auto' }}
          />
        )}
        <Title order={3}>{title}</Title>
      </Group>
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
