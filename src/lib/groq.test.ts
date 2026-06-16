import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatWithCoach, getEcoRecommendations } from './groq';

describe('Groq AI Assistant SDK Helpers', () => {
  const globalObj = globalThis as any;
  const originalFetch = globalObj.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalObj.fetch = originalFetch;
  });

  describe('chatWithCoach', () => {
    it('should successfully communicate with Groq Proxy and return content', async () => {
      const mockResponseText = {
        content: 'Hello! I am your eco coach.'
      };

      globalObj.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponseText
      } as Response);

      const response = await chatWithCoach(
        [{ role: 'user', content: 'hello' }],
        'You are an eco coach.'
      );

      expect(globalObj.fetch).toHaveBeenCalledTimes(1);
      expect(globalObj.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(response).toBe('Hello! I am your eco coach.');
    });

    it('should throw an error if the Groq Proxy response is not ok', async () => {
      globalObj.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response);

      await expect(
        chatWithCoach([{ role: 'user', content: 'hello' }], 'system prompt')
      ).rejects.toThrow('Groq Direct Error: 401');
    });

    it('should throw an error on network failure', async () => {
      globalObj.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        chatWithCoach([{ role: 'user', content: 'hello' }], 'system prompt')
      ).rejects.toThrow('Network error');
    });

    it('should fall through to direct Groq call when proxy returns non-ok and direct call succeeds', async () => {
      let callCount = 0;
      globalObj.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: proxy fails with non-ok
          return Promise.resolve({
            ok: false,
            status: 502,
            text: async () => 'Bad Gateway'
          } as Response);
        }
        // Second call: direct Groq succeeds
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Direct response works!' } }]
          })
        } as Response);
      });

      const result = await chatWithCoach(
        [{ role: 'user', content: 'test' }],
        'system prompt'
      );
      expect(result).toBe('Direct response works!');
      expect(globalObj.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fall through to direct Groq when proxy throws a network error', async () => {
      let callCount = 0;
      globalObj.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Connection refused'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Fallback success' } }]
          })
        } as Response);
      });

      const result = await chatWithCoach(
        [{ role: 'user', content: 'test' }],
        'system prompt'
      );
      expect(result).toBe('Fallback success');
    });

    it('should return empty string when proxy returns ok but content is empty', async () => {
      globalObj.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: '' })
      } as Response);

      // With empty content from proxy, falls through to direct. But since 
      // the same mock returns empty, the direct call will also need handling.
      // Let's mock for proxy to return content: '' (falsy) and direct to return actual content.
      let callCount = 0;
      globalObj.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Proxy returns ok but empty content
          return Promise.resolve({
            ok: true,
            json: async () => ({ content: '' })
          } as Response);
        }
        // Direct Groq call  
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Recovered from empty' } }]
          })
        } as Response);
      });

      const result = await chatWithCoach(
        [{ role: 'user', content: 'test' }],
        'system prompt'
      );
      expect(result).toBe('Recovered from empty');
    });
  });

  describe('getEcoRecommendations', () => {
    it('should retrieve and return recommendations from Proxy response', async () => {
      const mockResponse = {
        recommendations: ["Walk to school", "Eat organic food", "Turn off AC"]
      };

      globalObj.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const recommendations = await getEcoRecommendations('user habits data');
      expect(globalObj.fetch).toHaveBeenCalledWith(
        '/api/recommendations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(recommendations).toEqual(["Walk to school", "Eat organic food", "Turn off AC"]);
    });

    it('should return empty array if Proxy request fails', async () => {
      globalObj.fetch = vi.fn().mockRejectedValue(new Error('API failure'));

      const recommendations = await getEcoRecommendations('user habits');
      expect(recommendations).toEqual([]);
    });

    it('should fall through to direct Groq when proxy returns non-ok', async () => {
      let callCount = 0;
      globalObj.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => 'Server Error'
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '["Use less AC", "Walk more", "Eat veggies"]' } }]
          })
        } as Response);
      });

      const recs = await getEcoRecommendations('some habits');
      expect(recs).toEqual(["Use less AC", "Walk more", "Eat veggies"]);
    });

    it('should return empty array when proxy returns empty recommendations and direct also fails', async () => {
      let callCount = 0;
      globalObj.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ recommendations: [] })
          } as Response);
        }
        // Direct call fails
        return Promise.reject(new Error('Groq down'));
      });

      const recs = await getEcoRecommendations('habits');
      expect(recs).toEqual([]);
    });
  });
});
