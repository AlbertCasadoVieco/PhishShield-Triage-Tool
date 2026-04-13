import { parsePayload } from './heuristic';

self.onmessage = (e: MessageEvent) => {
  const { headers, body, whitelists } = e.data;
  
  try {
    const result = parsePayload(headers, body, whitelists);
    self.postMessage({ status: 'success', result });
  } catch (error) {
    self.postMessage({ status: 'error', error: String(error) });
  }
};
