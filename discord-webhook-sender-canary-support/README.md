# Hooksend — Discord Webhook Sender

A small React + Vite Discord webhook sender, ready to deploy on Vercel.

## Run locally
1. Install Node.js (LTS).
2. In this folder, run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Deploy to Vercel
1. Upload this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel should detect Vite automatically. Build command: `npm run build`; output directory: `dist`.
4. Click **Deploy**.

## Notes
- This app sends directly from the browser to Discord's webhook endpoint; it does not store webhook URLs on a server.
- Use only webhook URLs you own or are authorized to use. Treat the URL like a password.
- Mentions are disabled by default through `allowed_mentions`.
- No bulk sending, scheduling, or message automation is included.
