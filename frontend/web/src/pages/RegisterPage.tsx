import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper, Title, Stack, Group, Anchor, Select, MultiSelect, Container } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useForm } from '@mantine/form';

interface RegisterFormValues {
  username: string;
  email: string;
  emailConfirmation: string;
  password: string;
  passwordConfirmation: string;
  settings: {
    preferredLanguage: string;
    spokenLanguages: string[];
  };
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    initialValues: {
      username: '',
      email: '',
      emailConfirmation: '',
      password: '',
      passwordConfirmation: '',
      settings: {
        preferredLanguage: 'en',
        spokenLanguages: ['en'],
      },
    },
    validate: {
      username: (value) => (value.length < 3 ? 'Username must be at least 3 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      emailConfirmation: (value, values) => 
        value !== values.email ? 'Email addresses do not match' : null,
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
      passwordConfirmation: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          username: values.username,
          settings: {
            preferredLanguage: values.settings.preferredLanguage,
            spokenLanguages: values.settings.spokenLanguages,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'VALIDATION_ERROR') {
          if (error.message.includes('email')) {
            form.setErrors({ email: 'Email already in use' });
          } else if (error.message.includes('username')) {
            form.setErrors({ username: 'Username already taken' });
          } else if (error.message.includes('Password must be')) {
            form.setErrors({ password: error.message });
          } else {
            form.setErrors({ email: error.message });
          }
        } else {
          throw new Error(error.message || 'Registration failed');
        }
        return;
      }

      navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
    } catch (error) {
      if (error instanceof Error) {
        form.setErrors({ 
          email: 'Registration failed. Please try again.' 
        });
      }
    }
  };

  return (
    <Container size={400} py={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Create an Account
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Username"
              placeholder="Choose a username"
              {...form.getInputProps('username')}
            />

            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps('email')}
            />

            <TextInput
              required
              label="Confirm Email"
              placeholder="Confirm your email"
              {...form.getInputProps('emailConfirmation')}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              {...form.getInputProps('passwordConfirmation')}
            />

            <Select
              label="Preferred Language"
              data={[
                { value: 'en', label: 'English' },
                { value: 'de', label: 'German' },
              ]}
              {...form.getInputProps('settings.preferredLanguage')}
            />

            <MultiSelect
              label="Spoken Languages"
              data={[
                { value: 'en', label: 'English' },
                { value: 'de', label: 'German' },
              ]}
              {...form.getInputProps('settings.spokenLanguages')}
            />

            <Button type="submit" fullWidth>
              Register
            </Button>

            <Group justify="space-between" mt="xl">
              <Anchor component={Link} to="/login" size="sm">
                Already have an account? Login
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
