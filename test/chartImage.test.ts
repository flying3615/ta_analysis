import { describe, it, expect, vi, afterEach } from 'vitest';
import { inspect } from 'node:util';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('image-to-base64', () => ({ default: vi.fn() }));

import axios from 'axios';
import { fetchChartData } from '../src/image/chartImage.js';

const FAKE_KEY = 'FAKE-KEY-123';

describe('fetchChartData error logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CHART_IMG_API_KEY;
  });

  it('does not write the API key to the log', async () => {
    process.env.CHART_IMG_API_KEY = FAKE_KEY;
    const err = Object.assign(
      new Error('Request failed with status code 401'),
      {
        isAxiosError: true,
        config: { headers: { 'x-api-key': FAKE_KEY } },
        response: { status: 401, data: { message: 'bad key' } },
      }
    );
    vi.mocked(axios.post).mockRejectedValue(err);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await fetchChartData('TSLA', [
      { interval: '1D', studies: [] } as any,
    ]);

    expect(res).toEqual([]);
    expect(spy).toHaveBeenCalled();
    const logged = spy.mock.calls
      .flat()
      .map(a => (typeof a === 'string' ? a : inspect(a, { depth: 10 })))
      .join('\n');
    expect(logged).not.toContain(FAKE_KEY);
    expect(logged).toContain('401');
  });
});
