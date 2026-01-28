import { sendMessage, ServerSideError } from '../networking';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// 1. Setup MSW Server
const server = setupServer(
    http.post('http://127.0.0.1:8000/sendMessage', () => {
        return HttpResponse.json({ status: 'success', response: { message: "Hello", type: "ai" } })
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Networking Service', () => {
    it('sendMessage returns successful response', async () => {
        const result = await sendMessage({
            uid: "test-uid",
            prompt: "Hello",
            notificationToken: "abc",
            notify: false
        });

        expect(result).toEqual({ status: 'success', response: { message: "Hello", type: "ai" } });
    });

    it('sendMessage handles 500 error', async () => {
        // Override handler to return 500
        server.use(
            http.post('http://127.0.0.1:8000/sendMessage', () => {
                return new HttpResponse(null, { status: 500 })
            })
        );

        await expect(sendMessage({
            uid: "test-uid",
            prompt: "Hello",
            notificationToken: "abc",
            notify: false
        })).rejects.toThrow(ServerSideError);
    });
});
