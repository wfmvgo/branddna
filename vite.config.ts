import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function websiteProxyPlugin(): Plugin {
  return {
    name: 'website-proxy',
    configureServer(server) {
      // Image proxy to bypass CORS
      server.middlewares.use('/api/proxy-image', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const imageUrl = url.searchParams.get('url');
        if (!imageUrl) {
          res.statusCode = 400;
          res.end('Missing url');
          return;
        }
        try {
          const response = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'image/*,*/*',
            },
            redirect: 'follow',
          });
          const contentType = response.headers.get('content-type') || 'image/png';
          const buffer = Buffer.from(await response.arrayBuffer());
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.end(buffer);
        } catch {
          res.statusCode = 502;
          res.end('Failed to fetch image');
        }
      });

      // Website HTML fetcher
      server.middlewares.use('/api/fetch-site', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          let fullUrl = targetUrl;
          if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;

          const response = await fetch(fullUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
          });

          const html = await response.text();
          const finalUrl = response.url;

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ html, finalUrl }));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), websiteProxyPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
