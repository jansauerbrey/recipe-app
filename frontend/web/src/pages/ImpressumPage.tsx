import React from 'react';
import { Container, Title, Text, Stack } from '@mantine/core';

export const ImpressumPage: React.FC = () => {
  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={1}>Impressum</Title>
        
        <Stack gap="xs">
          <Title order={2}>Contact Information</Title>
          <Text>
            Recipe Planner
            <br />
            rezept-planer.de
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2}>Responsible for Content</Title>
          <Text>
            This is a personal project for recipe planning and management.
            For questions or concerns, please contact us through the provided channels.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2}>Privacy Policy</Title>
          <Text>
            We take the protection of your personal data seriously. Your data is handled
            confidentially and in accordance with data protection regulations.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2}>Disclaimer</Title>
          <Text>
            The contents of this website have been created with the utmost care.
            However, we cannot guarantee the accuracy, completeness, and timeliness
            of the content. As a service provider, we are responsible for our own
            content on these pages according to general laws.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
};
