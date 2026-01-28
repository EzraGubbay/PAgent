import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';
import { NavigationContainer } from '@react-navigation/native';

// Import any other providers your app uses (Theme, Auth, etc.)

interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <NavigationContainer>
            {children}
        </NavigationContainer>
      </MenuProvider>
    </SafeAreaProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };
