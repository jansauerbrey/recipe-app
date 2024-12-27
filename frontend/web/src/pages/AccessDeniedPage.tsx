import React from 'react';
import { Title, Text, Button, Stack, Center } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Center h="100%">
      <Stack align="center" gap="md">
        <Title order={1}>Access Denied</Title>
        <Text>Sorry, you don't have permission to access this page.</Text>
        <Button onClick={() => navigate('/home')}>
          Return to Home
        </Button>
      </Stack>
    </Center>
  );
};
