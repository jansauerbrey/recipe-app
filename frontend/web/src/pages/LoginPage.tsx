import React from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Group, Anchor, Alert, Container } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types/auth';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { message?: string; from?: { pathname: string } } };
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
    },
  });

  const handleSubmit = async (values: LoginCredentials) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await login(values as { email: string; password: string });
      // Navigation is handled in AuthContext after successful login
    } catch (error) {
      form.setErrors({ email: 'Invalid credentials' });
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Container size={400} py={40}>
      <Paper radius="md" p="xl" withBorder>
        {location.state?.message && (
          <Alert
            mb="md"
            variant="light"
            color="green"
            title="Success"
            icon={<IconCheck size="1rem" />}
          >
            {location.state.message}
          </Alert>
        )}

        <Title order={2} ta="center" mb="md">
          Welcome to Recipe Planner
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
              Sign in
            </Button>

            <Group justify="space-between" mt="xl">
              <Anchor component={Link} to="/register" size="sm">
                Don't have an account? Register
              </Anchor>
              <Anchor component={Link} to="/impressum" size="sm">
                Impressum
              </Anchor>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};
