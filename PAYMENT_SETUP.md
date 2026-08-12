# GRABB-IT Clothing — Payment Gateway & Methods Architecture Guide

This document explains the payment system implementation, sandbox test modes, and instructions for configuring live payment credentials when the business bank account and Razorpay account become available.

---

## 1. Supported Payment Methods

1. **Razorpay (Credit / Debit Cards, Netbanking, Automated UPI)**
2. **Direct UPI / Google Pay / PhonePe (Manual Transfer with UTR Reference Verification)**
3. **Bank Wire Transfer (NEFT / IMPS / RTGS with UTR Reference Verification)**

---

## 2. Sandbox & Development Test Mode

During development (when live business bank credentials and Razorpay keys are not configured):
* **Razorpay**: The system automatically operates in **Test Mode**. It allows seamless checkout testing without throwing key errors.
* **Manual UPI & Bank Transfer**: Orders are created with payment status `MANUAL_PAYMENT_PENDING`. Customers can input test 12-digit UTR numbers (e.g. `123456789012`). Admins can verify or reject payments from the Admin Dashboard (`/admin`).

---

## 3. Transitioning to LIVE Razorpay Credentials

When your Razorpay business account is approved:

### Step 1: Environment Variables
Add your live Razorpay credentials to your backend environment on Render (or `.env`):

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret_here
```

### Step 2: Configure Webhooks in Razorpay Dashboard
1. Go to **Razorpay Dashboard** -> **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. Set Webhook URL: `https://your-render-backend.onrender.com/api/payments/webhook`
4. Enter your `RAZORPAY_WEBHOOK_SECRET`.
5. Select active events:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`

*No code changes are required! The backend automatically detects your live keys and switches from test mode to live SDK processing.*

---

## 4. Configuring Store Owner UPI & Bank Account Details

Shop owners can update bank details directly from the Admin Dashboard or via the database without changing code:

* **UPI ID**: `grabb-it@upi`
* **UPI Display Name**: `GRABB-IT CLOTHING PVT LTD`
* **Bank Name**: `HDFC Bank Ltd`
* **Account Holder**: `GRABB-IT CLOTHING PVT LTD`
* **Account Number**: `•••• •••• 5821`
* **IFSC Code**: `HDFC0001234`
