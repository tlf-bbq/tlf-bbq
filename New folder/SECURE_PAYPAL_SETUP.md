# Secure PayPal Setup

This keeps the PayPal checkout experience on the site but moves the risky parts off the browser:

- PayPal order creation happens in `/api/create-paypal-order`
- PayPal capture verification happens in `/api/capture-paypal-order`
- Web3Forms email sending happens on the backend

## Environment Variables

Use the values from [`.env.example`](/C:/Users/aiden/OneDrive/New%20folder/.env.example):

- `FRONTEND_ORIGIN`
- `ORDER_SIGNING_SECRET`
- `PAYPAL_ENVIRONMENT`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `WEB3FORMS_ACCESS_KEY`

## Recommended Host

Deploy the whole folder to Vercel so the static site and `/api/*` functions live together.

## Test Flow

1. Set `PAYPAL_ENVIRONMENT=sandbox`
2. Add your PayPal sandbox client ID and secret
3. Add your Web3Forms access key as an environment variable
4. Open the deployed page
5. Add `?emailtest=1` to the URL if you want the test email button
6. Complete a PayPal sandbox payment
7. The backend captures the order and then sends the order email

## Why This Is Safer

- Your Web3Forms key is no longer in `JSDAD.js`
- Your PayPal client secret is never exposed to the browser
- Order emails are only triggered after the backend captures the PayPal order
