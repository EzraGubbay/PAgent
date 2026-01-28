import React from 'react';
import { render, fireEvent, waitFor, screen } from '@/utils/test-utils';
import AuthScreen from '../AuthScreen';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Setup Mock User Data
jest.mock("@/types/data", () => ({
    loadUserData: jest.fn().mockResolvedValue({ uid: "test-uid" }),
}));

// Setup MSW
const server = setupServer(
    http.post('http://127.0.0.1:8000/login', () => {
        return HttpResponse.json({ status: 'success', uid: "new-uid", message: "Login successful" })
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AuthScreen', () => {
    it('renders login screen correctly', () => {
        const { getByText, getByPlaceholderText } = render(
            <AuthScreen navigation={{}} onLoginSuccess={jest.fn()} />
        );

        expect(getByText('Welcome Back')).toBeTruthy();
        expect(getByPlaceholderText('Username')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('toggles between login and signup', () => {
        const { getByText, queryByText } = render(
            <AuthScreen navigation={{}} onLoginSuccess={jest.fn()} />
        );

        // Initially Login
        expect(getByText('Log In')).toBeTruthy();

        // Switch
        fireEvent.press(getByText('New here? Sign Up'));

        // Now Signup
        expect(getByText('Sign Up')).toBeTruthy();
        expect(getByText('Create Account')).toBeTruthy();
    });
});
