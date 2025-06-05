# Finding WhatsApp Recipients Section - Alternative Methods

## Issue: Recipients Section Not Visible

The Recipients/Message Settings section can be hard to find in WhatsApp Manager. Here are alternative ways to locate it:

## 🔍 **Method 1: Business Manager Settings**

Try this alternative path:

1. **https://business.facebook.com/settings/**
2. **Data Sources** → **WhatsApp Accounts**
3. Find your WABA: `596136450071721`
4. Click **"View Details"** or **"Manage"**
5. Look for **"Phone Numbers"** or **"Messaging"** tab
6. Click on phone number: `564943553373191`
7. Look for **"Test Recipients"** or **"Recipients"**

## 🔍 **Method 2: Developer Console**

Sometimes recipients are managed in the Developer Console:

1. **https://developers.facebook.com/apps/**
2. Find your app (App ID: `953206047023164`)
3. **WhatsApp** → **Getting Started** or **Configuration**
4. Look for **"Add Recipients"** or **"Test Numbers"**
5. Add your phone number there

## 🔍 **Method 3: WhatsApp Business Platform**

Try the WhatsApp-specific URL:

1. **https://business.facebook.com/wa/manage/home/**
2. **Phone Numbers** → Find `564943553373191`
3. Click the **three dots (⋯)** next to the phone number
4. Look for **"Manage Recipients"** or **"Test Numbers"**

## 🔍 **Method 4: Check Account Status**

Your WABA might not be in development mode. Let's check:

```bash
curl -H "Authorization: Bearer WHATSAPP_SYSTEM_USER_TOKEN" \
  "https://graph.facebook.com/v18.0/596136450071721?fields=account_review_status,status"
```

Look for:
- `"status": "PENDING"` = Development mode (needs recipients)
- `"status": "APPROVED"` = Production mode (no recipients needed)

## 🚀 **Alternative: Use API to Add Recipients**

If you can't find the UI, you can add recipients via API:

```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/564943553373191/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

## 🎯 **What to Look For**

The recipients section might be labeled as:
- "Test Recipients"
- "Allowed Recipients"  
- "Phone Number Recipients"
- "Development Recipients"
- "Message Settings" → "Recipients"
- "Sandbox Numbers"

## 📱 **Screenshots/Visual Cues**

Look for:
- A section with phone number input fields
- Text like "Add phone numbers that can receive messages"
- A list of current allowed numbers
- Buttons labeled "Add Recipient" or "Add Number"

## 🆘 **If Still Not Found**

1. **Check Permissions**: Make sure you're an admin on the Business Manager
2. **Contact Original Setup Person**: Ask who originally configured the WhatsApp integration
3. **Submit Support Ticket**: Contact Meta Business Support
4. **Try Different Browser**: Sometimes interface elements don't load properly

## 📧 **Meta Support Contact**

If you can't find it anywhere:
- **Meta Business Help Center**: https://www.facebook.com/business/help
- **WhatsApp Business API Support**: Submit a ticket explaining you can't find the Recipients section for WABA `596136450071721` 