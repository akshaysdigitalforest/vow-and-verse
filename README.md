# Vow & Verse — Invitation Studio

A static wedding invitation marketplace/editor made with HTML, CSS and vanilla JavaScript. The project has no build step and can be hosted on GitHub Pages.

## Included

- 20 selectable wedding invitation themes with free/signature labels and style filters.
- Live editor for names, date, ceremony time, venue, location, message, photo URL, RSVP phone, and dress note.
- Browser-local draft autosave, shareable preview URL, and standalone HTML downloads for the four free designs.
- Responsive storefront, example packages, and configurable external checkout links.

## Personalize the product

1. Open `script.js` and edit `storeSettings` to set your real prices and checkout URLs.
2. Create digital products/payment links with your chosen checkout provider. Put the relevant URLs in `checkoutLinks.single` and `checkoutLinks.custom`.
3. Replace the example package text/prices in `index.html` so they match what you actually deliver.
4. Update branding, support contact, privacy notice, and terms before selling.
5. Add your own licensed fonts and photos if you want the project to avoid third-party image/font dependencies.

## Publish on GitHub Pages

1. Create a GitHub repository and upload the project files to its root.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Use the Pages URL shown in the repository settings.

## Selling limitations to plan for

This project is a client-side prototype. It does not verify payments, issue receipts, persist customer orders, or securely unlock paid downloads. The checkout buttons can link to an external checkout, but the checkout product and fulfillment still need to be configured. A browser-only premium lock can be bypassed because all JavaScript and files are public. For automatic paid access and customer-specific invitations, add a server-side checkout webhook/database or use a storefront that handles digital delivery. The draft is saved only in the visitor's browser; a copied preview URL includes names, date, venue, and message in its URL fragment, so only share details intended for guests.

GitHub Pages can host the builder and downloaded HTML invitations. Each customer needs a place to host their own invitation page if they want a unique shareable website URL; custom domains also need domain and DNS setup.
