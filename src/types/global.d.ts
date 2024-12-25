interface globalThis {
  openApiSpec: {
    paths: {
      [path: string]: {
        [method: string]: {
          parameters?: Array<{
            name: string;
            in: string;
            required?: boolean;
          }>;
          requestBody?: {
            required?: boolean;
            content?: {
              [contentType: string]: {
                schema: unknown;
              };
            };
          };
          responses?: {
            [statusCode: string]: {
              content?: {
                [contentType: string]: {
                  schema: unknown;
                };
              };
            };
          };
        };
      };
    };
  };
}

export {};
