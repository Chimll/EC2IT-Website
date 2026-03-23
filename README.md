# EC2IT Website

Static website for EC2IT – London IT Support.

## Structure

```
ec2it/
├── index.html          Home page (all sections)
├── services.html       Services detail page
├── about.html          About EC2IT
├── contact.html        Contact form
├── 404.html            Custom 404 page
├── .nojekyll           Disables Jekyll on GitHub Pages
├── assets/
│   ├── css/style.css   Shared stylesheet
│   └── js/main.js      Shared JavaScript
```

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `ec2it-website`)
2. Copy all files in this folder into the repo root
3. Push to GitHub
4. Go to **Settings → Pages**
5. Set Source to **Deploy from a branch**, branch: `main`, folder: `/ (root)`
6. Your site will be live at `https://yourusername.github.io/ec2it-website`

### Custom domain (when ready)
1. Add a `CNAME` file at the root containing just: `ec2it.co.uk`
2. Update your DNS registrar to point the domain to GitHub Pages
3. Enable "Enforce HTTPS" in GitHub Pages settings

## Contact Form

The contact form uses [Formspree](https://formspree.io) for submissions.

To activate:
1. Sign up at https://formspree.io (free tier: 50 submissions/month)
2. Create a new form
3. Copy your endpoint URL (e.g. `https://formspree.io/f/xpwzknrp`)
4. In both `index.html` and `contact.html`, update the form's `action` attribute:
   ```html
   <form id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" ...>
   ```

## Security

The site includes the following security measures:

- **HTTPS** – enforced automatically by GitHub Pages
- **CSP** – Content Security Policy via `<meta http-equiv>` tags on all pages
- **X-Content-Type-Options** – `nosniff` on all pages
- **Referrer-Policy** – `strict-origin-when-cross-origin`
- **Permissions-Policy** – geolocation, microphone, camera disabled
- **Honeypot field** – contact forms include a hidden field to trap bots
- **Client-side form validation** – email format, required fields, phone format
- **`rel="noopener noreferrer"`** – on all external links
- **No inline JS** – all JavaScript in external file for easier CSP management

> **Note:** For stronger server-side security headers (X-Frame-Options, HSTS, etc.), consider deploying to **Netlify** or **Cloudflare Pages** which support custom HTTP headers via a `_headers` file.
