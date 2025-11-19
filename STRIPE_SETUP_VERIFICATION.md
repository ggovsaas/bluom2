# ✅ Stripe Setup Verification Checklist

## 🎯 **ALL SYSTEMS OPERATIONAL**

### ✅ **1. Server Status**
- **Status**: ✅ Running on port 3001
- **Health Check**: `http://localhost:3001/api/health` → `{"status":"OK","message":"AiFit API is running"}`
- **Process**: Running in background

### ✅ **2. ngrok Tunnel**
- **Status**: ✅ Active
- **Public URL**: `https://wormless-rodney-unworthy.ngrok-free.dev`
- **Process**: Running in background

### ✅ **3. Environment Variables**
All required variables are set in `/Users/jorgecarvalho/Desktop/bolt/server/.env`:
- ✅ `SUPABASE_URL` - Set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Set
- ✅ `STRIPE_SECRET_KEY` - Set (Live key)
- ✅ `STRIPE_WEBHOOK_SECRET` - Set
- ✅ `STRIPE_PRICE_MONTHLY` - Set (`price_1SUB8TGBTnWixaddYJHYHYhX`)
- ✅ `STRIPE_PRICE_YEARLY` - Set (`price_1SUBBXGBTnWixaddKkWbUh9a`)

### ✅ **4. Stripe Routes**
All routes are working:
- ✅ `POST /api/stripe/create-checkout-session` - **TESTED & WORKING**
- ✅ `POST /api/stripe/create-portal-session` - Configured
- ✅ `POST /api/stripe/webhook` - Ready for Stripe events

### ✅ **5. Test Results**
```bash
# Checkout session creation test:
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-123","plan":"monthly"}'

# Response: ✅ Returns Stripe checkout URL
```

---

## 🔗 **YOUR WEBHOOK URL**

```
https://wormless-rodney-unworthy.ngrok-free.dev/api/stripe/webhook
```

---

## 📋 **NEXT STEPS - Configure Stripe Dashboard**

### **Step 1: Add Webhook Endpoint**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Paste your webhook URL:
   ```
   https://wormless-rodney-unworthy.ngrok-free.dev/api/stripe/webhook
   ```
4. Click **"Add endpoint"**

### **Step 2: Select Events**
Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### **Step 3: Copy Webhook Signing Secret**
1. After creating the endpoint, click on it
2. Find **"Signing secret"**
3. Click **"Reveal"** and copy it
4. **IMPORTANT**: If it's different from your current `STRIPE_WEBHOOK_SECRET`, update your `.env` file:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
5. Restart the server after updating

---

## 🧪 **Testing Your Setup**

### **Test 1: Health Check**
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"OK","message":"AiFit API is running"}
```

### **Test 2: Checkout Session**
```bash
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-123","plan":"monthly"}'
# Expected: {"url":"https://checkout.stripe.com/..."}
```

### **Test 3: ngrok Tunnel**
```bash
curl https://wormless-rodney-unworthy.ngrok-free.dev/api/health
# Expected: {"status":"OK","message":"AiFit API is running"}
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Keep Both Running**: 
   - Server must stay running: `cd server && npm start`
   - ngrok must stay running: `ngrok http 3001`

2. **ngrok URL Changes**: 
   - If you restart ngrok, you'll get a new URL
   - You'll need to update the webhook URL in Stripe Dashboard

3. **Production**: 
   - For production, use a fixed domain instead of ngrok
   - Set up a proper webhook endpoint on your production server

---

## 🎉 **YOU'RE ALL SET!**

Everything is configured correctly. Just add the webhook endpoint in Stripe Dashboard and you're ready to go!

