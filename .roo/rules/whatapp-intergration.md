---
description: 
globs: 
alwaysApply: true
---

# Integration Plan: WhatsApp Cloud API for ZenRent (React/Next.js & Node.js)

Overview and Goals

ZenRent will integrate the WhatsApp Cloud API as a tech provider, enabling each landlord (multi-tenant identified by auth.user.id) to use WhatsApp for tenant communications. The key goals are:
	•	Embedded Signup Onboarding: Allow landlords to connect or create their WhatsApp Business Account (WABA) via Facebook’s Embedded Signup flow (within ZenRent) ￼. This ensures each landlord has a dedicated WABA (and phone number) linked to ZenRent’s application.
	•	Tenant Contact Synchronization: Import or map the landlord’s tenant contact info into the system so they can be messaged on WhatsApp. Since WhatsApp’s Cloud API doesn’t maintain a contact list, ZenRent will store and map tenant phone numbers to each landlord’s WhatsApp setup in the backend (and optionally verify which are WhatsApp-active).
	•	Messaging Integration (Send/Receive): Enable landlords to send messages to tenants and receive replies through the Cloud API. This entails using the Cloud API’s /PHONE_NUMBER_ID/messages endpoint for outgoing messages ￼ and setting up a webhook to handle incoming messages and status updates.

This plan covers full-stack implementation: the Next.js frontend flow for onboarding and sending messages, and the Node.js backend for handling API calls, data persistence, and webhooks. It also details required Meta app configuration, data models, authentication, and code structure for a secure multi-tenant solution.

Prerequisites & Facebook App Configuration

Before coding, ensure the following setup in Meta (Facebook) Developer and Business Manager:
	•	Meta App & Developer Account: Create (or use) a Facebook Developer app under ZenRent’s Meta Business. Enable the WhatsApp Business Platform product on this app ￼. Also register as a WhatsApp Tech Provider (Business Solution Provider) and verify ZenRent’s business with Facebook if not done ￼. Being a verified tech provider unlocks the WhatsApp management permissions and Embedded Signup features.
	•	App Permissions: In the Meta app, request and obtain the whatsapp_business_management permission (for managing WhatsApp business assets) and whatsapp_business_messaging permission (for sending messages) for your app. These likely require your app to go through Facebook’s App Review process for advanced access ￼ ￼. Also ensure the app is business-verified (Facebook requires business verification for these WhatsApp permissions).
	•	Embedded Signup Config: Set up Facebook Login for Business in your app settings to use Embedded Signup. In the Facebook Developer Portal, navigate to Facebook Login for Business > Configurations and create a new Configuration for WhatsApp Embedded Signup ￼ ￼. Select “WhatsApp Embedded Signup” as the login variation. This generates a config_id (Configuration ID) – note this for use in the frontend code ￼. Enable OAuth settings: turn on Client OAuth Login, Web OAuth Login, Embedded Browser OAuth Login, and add your ZenRent domain to Allowed OAuth Redirect URIs if required ￼. (The Embedded Signup flow typically uses a popup/iframe so a redirect URI may not be needed when using the JS SDK, but it’s good to configure the domain and enable “Login with the JavaScript SDK” ￼.)
	•	App Roles & Tokens: Generate a System User in your Meta Business (ZenRent’s business) with the WhatsApp business management role. This system user will be used to obtain a long-lived token to act on behalf of customer WABAs. You can create the system user in Business Manager and assign your app with Assets access to WhatsApp accounts. Alternatively, plan to use the landlord’s user access token (from OAuth) initially and later exchange for a system user token for persistent API calls. (We will discuss token handling in the backend integration.)
	•	Webhook Setup in Meta App: Configure a Webhook for WhatsApp Business Account in your app: In App Dashboard > Webhook, add a callback URL and a Verify Token for the whatsapp_business_account object. Subscribe to relevant fields (e.g. messages, message_reactions, message_templates_status_update) as needed. At minimum, subscribe to messages to receive incoming messages and delivery/read status events. Facebook will send a verification challenge to your callback – we’ll handle this in the backend. No events will flow until the webhook is set and your app is subscribed to each landlord’s WABA (which we handle via Graph API) ￼.

Documentation References: It’s recommended to review Meta’s official docs on WhatsApp Business API and Embedded Signup (e.g. “Embedded Signup – Implementation” and “Onboarding customers as a Tech Provider”) for detailed prerequisites and screenshots of the above steps. These cover the flow and required app settings in depth ￼.

Frontend: Embedded Signup Onboarding Flow (Next.js)

On the front end, we will embed the WhatsApp onboarding flow so each landlord can connect their WhatsApp Business Account without leaving ZenRent. Key steps and implementation details in Next.js/React:
	•	Facebook JS SDK Integration: Include the Facebook JavaScript SDK on the ZenRent frontend. For Next.js, you can add a <Script> tag in _app.js or use Next’s dynamic loading to insert the SDK script from https://connect.facebook.net/en_US/sdk.js. Initialize it with your App ID. For example:

window.fbAsyncInit = function() {
  FB.init({
    appId      : '<YOUR_APP_ID>',
    version    : 'v16.0',  // or latest Graph API version
    status     : true
  });
};

Ensure this runs on client side only. You may also call FB.init in a React useEffect once the SDK script is loaded.

	•	“Connect WhatsApp” UI: Provide a button or link in the landlord’s dashboard (e.g., Account Settings > WhatsApp Integration) that triggers the Embedded Signup. For example, a Connect WhatsApp button that calls a function launchEmbeddedSignup(). This function will invoke FB.login with the special configuration ID obtained earlier. For instance:

function launchEmbeddedSignup() {
  FB.login(response => {
    console.log('FB login response', response);
    // We will handle the post-login via event listener instead of this callback.
  }, {
    config_id: '<YOUR_CONFIG_ID>',
    auth_type: 'rerequest',
    response_type: 'code',
    override_default_response_type: true,
    extras: { sessionInfoVersion: 3 }
  });
}

The config_id tells Facebook to use the WhatsApp Embedded Signup flow. We set response_type: 'code' to get an authorization code (instead of a short-lived token) for security, and sessionInfoVersion: 3 is recommended by Meta to ensure the returned data includes the WABA ID ￼ ￼. (The auth_type: 'rerequest' just ensures the dialog re-prompts if the user had previously granted permissions.)

	•	Embedded Signup Workflow: Once FB.login is called, Facebook’s Embedded Signup popup will guide the landlord through these steps: 1) Log into Facebook and select or create their Business Manager (“Meta Business Portfolio”), 2) Create a new WhatsApp Business Account (or select an existing WABA), 3) Enter a phone number (and WhatsApp display name and business details) for WhatsApp, 4) Verify the phone via OTP (SMS or voice code) ￼. After completion, the WhatsApp account and phone number are created and automatically connected to ZenRent’s app as a tech provider. (If the landlord had a pre-existing WhatsApp Business Account and number, the flow lets them select those instead of creating new ones.)
	•	Capturing Onboarding Results: When the Embedded Signup flow completes (or is canceled), the Facebook SDK will broadcast a message event to the parent window. We set up a window.addEventListener('message', ...) in our React component to listen for these events ￼. For example:

useEffect(() => {
  const embeddedSignupListener = event => {
    if (!event.origin.includes('facebook.com')) return;
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
          const { waba_id, phone_number_id } = data.data;
          console.log('WhatsApp setup complete:', waba_id, phone_number_id);
          // Send these IDs to backend for further processing...
          completeOnboarding(waba_id, phone_number_id);
        } else if (data.event === 'CANCEL') {
          console.warn('User canceled WhatsApp onboarding at step', data.data.current_step);
        } else if (data.event === 'ERROR') {
          console.error('Error during WhatsApp onboarding:', data.data.error_message);
        }
      }
    } catch(e) {
      console.log('Received non-JSON message from FB SDK');
    }
  };
  window.addEventListener('message', embeddedSignupListener);
  return () => window.removeEventListener('message', embeddedSignupListener);
}, []);

In the above: when data.event === 'FINISH', we extract the waba_id (WhatsApp Business Account ID) and phone_number_id (the ID of the WhatsApp phone number the landlord just registered) ￼. We then call a function completeOnboarding(waba_id, phone_number_id) which will send this data to our backend API (e.g., via an AJAX call to a ZenRent API endpoint). The FINISH event indicates the landlord completed the full flow including phone setup; (FINISH_ONLY_WABA could indicate they completed creating the WABA but skipped phone number in case of a special flow – not typical unless using a custom phone provisioning). We also handle CANCEL and ERROR events to give feedback if needed.

	•	Posting data to Backend: Implement the completeOnboarding function to POST the relevant data to your backend. For example, it could fetch('/api/whatsapp/onboard', { method:'POST', body: JSON.stringify({ wabaId, phoneId }) }). You may also include the actual phone number and business name if needed: note that phone_number_id is an ID, not the phone itself. Since the phone number was input by the landlord in the flow, you might not have it directly from the event. To get the actual number (and display name), the backend can use Graph API calls (explained below) – or you could request the user input it again, but that’s not ideal. Instead, we’ll retrieve it via API.
	•	User Experience: After a successful onboarding, update the UI to reflect the connection (e.g., show the connected phone number and WhatsApp Business name, and provide options to send messages). If onboarding fails or is canceled, allow retrying. The front-end should not store sensitive tokens; it just initiates the flow and passes IDs to the backend. Authentication tokens will be handled securely on the server side.

Backend: Onboarding & Data Integration (Node.js)

On the backend, we will implement endpoints and services to finalize the onboarding, manage data, and facilitate messaging. We assume a Node.js environment (e.g., an Express server or Next.js API routes) and a database (e.g., MongoDB or SQL via an ORM) where ZenRent stores landlord and tenant info. Key backend responsibilities:

1. Exchange OAuth Code for Token (Authentication)

If the Embedded Signup was invoked with response_type: 'code', Facebook will return an authorization code that we need to exchange for an API token on the backend. In our front-end code above, we didn’t explicitly capture the code in the JS callback (we relied on the message event), but we can retrieve it via the response object in FB.login if needed. Alternatively, since the user granted permissions during the flow, Facebook implicitly granted our app access to the new WABA and phone. We can use a system user token associated with our app to access those assets (preferred for long-term use). However, initially using the user’s access token can confirm everything is set.

Token Retrieval: On receiving the POST with wabaId and phoneId, the backend can also expect or lookup the temporary authorization code from the user’s login. One approach is to include the response.authResponse.accessToken (if not using code flow) or the response.code in the POST payload. A more secure approach is to do a server-side OAuth code exchange. For example, if we got a code, call:

GET https://graph.facebook.com/v16.0/oauth/access_token?
    client_id={APP_ID}&client_secret={APP_SECRET}&code={CODE}&redirect_uri={YOUR_URL}

This returns a short-lived user access token for the landlord’s FB account with the granted permissions. We can then exchange that for a long-lived (~60 day) token if needed by calling oauth/access_token?grant_type=fb_exchange_token&.... However, rather than relying on a user token long-term, we should use this opportunity to generate a system user token or get an app-scoped token that has the required access. As a tech provider, our app should now have access to the customer’s WABA. In practice, Meta’s docs indicate that Embedded Signup will “grant your app access to those assets” (the WABA and phone) but you must perform additional API calls to fully onboard ￼.

In summary, implement a backend function to obtain an API token: either use the user’s token (from code exchange) initially or have a pre-configured system user token. The system user token approach involves: creating a system user under ZenRent’s Business Manager, granting it the developer role on the newly created WABA (this might be automatic if your business is added as a partner in the embedded flow), then generating a permanent token for that system user (in Business Manager > System Users > Generate Token with WhatsApp permissions). That token can then be stored and used for all API calls for this landlord’s WABA. This avoids needing the landlord to re-auth every 60 days.

For simplicity, you might start by using the exchanged user access token to make the initial Graph API calls below (Facebook often returns this token along with the embedded signup completion data when using the JS SDK). Ensure the token includes whatsapp_business_management permission. Later, you can automate system user assignment and use a system user token for ongoing messaging (since BSPs must use a token with whatsapp_business_messaging permission to send messages on behalf of the business ￼).

2. Fetch and Store WhatsApp Business Info

Now use the Graph API to retrieve and verify the assets created, and save them in ZenRent’s database:
	•	Get WABA details: You already have the WABA ID from the frontend event (wabaId). Optionally, call the Graph API to get more info about it (e.g., name, status). For example: GET /<WABA_ID>?fields=name,owner_business. This may require an access token with business management permission. Storing the WABA ID is essential for identifying the landlord’s WhatsApp account. If needed, also record the owner_business (the landlord’s Business Manager ID on Facebook) which can be returned by such queries. This could be useful if you need to later query or manage other assets under that business.
	•	Get Phone Number details: Similarly, we have the phone_number_id. Call GET /<PHONE_NUMBER_ID>?fields=display_phone_number,verified_name,status (or simply list the WABA’s phone numbers). For instance, GET /<WABA_ID>/phone_numbers with the appropriate token will list all phone numbers under that WABA ￼ ￼. This returns an array of phone objects including the display phone number (e.g., +1 212 555 1234) and the ID. From this, find the phone that matches the one the user just onboarded (in most cases there will be only one initially). Extract the display phone number and any other relevant fields (like the verified name or status – status should be Connected if the OTP verification was successful). Store the phone number and the phone number ID in your database, linked to the landlord’s user account.
	•	Store Access Tokens/IDs: In your data model (see Data Model section below), save the identifiers: whatsappBusinessAccountId (WABA ID) and whatsappPhoneNumberId and whatsappPhone for the landlord. If using a unique token for this landlord (e.g., a user token or system user token specific to their WABA), store that token securely (encrypted or in a secrets vault). However, since ZenRent will likely use one system user token that has access to all managed WABAs, you might not need to store per-landlord tokens – just ensure you can retrieve a valid auth token when making API calls on their behalf. One strategy: store the long-lived user token initially and asynchronously exchange it for a system user token. Another: store a flag that the landlord’s WABA is connected and use a single master token (if Meta’s partner setup allows your app to use one token for all client WABAs). In any case, ensure tokens are protected.
	•	Data Model Example: You might extend your Landlord (User) model to include a sub-document or fields for WhatsApp integration, e.g.:

landlord.whatsappIntegration = {
   wabaId: String,
   phoneId: String,
   phoneNumber: String,
   businessName: String,   // (if available or needed)
   waAccessToken: String,  // (if storing a specific token)
   status: String          // (e.g., 'pending', 'connected')
}

Or create a separate WhatsAppAccount collection mapping landlordId -> wabaId, phoneId, etc. Using a separate model can make it easier to handle multiple numbers in future or additional metadata. In a SQL schema, you’d have a WhatsAppAccounts table with landlord user foreign key, waba_id, phone_id, etc.

	•	Sync Tenant Contacts: (Relevant to goal #2) Once the landlord’s WhatsApp is connected, you might want to sync their tenant contacts. This means ensuring ZenRent knows which tenant phone numbers can be messaged via WhatsApp. Likely, ZenRent already has tenant data (phone numbers, names) from its rental platform. We will map these contacts to WhatsApp by storing them in our DB with reference to the landlord’s WABA. For instance, create a TenantContact table or use existing tenant records, adding a field like whatsappStatus or linking them to the landlord’s WhatsApp integration record. There is no direct API to “upload” contacts to the WhatsApp Business Account – WhatsApp doesn’t maintain a contact list; you simply message any number. However, you can use the Cloud API to check if a given phone number is a valid WhatsApp user by sending a test message or using the Contacts API (Cloud API does not provide an explicit contact verification endpoint for production use; in Cloud API you generally just attempt to message or rely on webhooks for delivery statuses). In sandbox/testing, there is a concept of adding recipients, but in production WABA this limit is lifted ￼. So, to sync contacts, do the following in ZenRent:
	•	Ensure each tenant’s phone number is stored in E.164 format (e.g., +14151234567).
	•	Optionally, use one Graph API call per tenant to check WhatsApp reachability: e.g., POST /<PHONE_NUMBER_ID>/contacts with the tenant number can return their WhatsApp ID if they are registered (this was available in On-Premise API; for Cloud API, the recommended approach is just send a message and handle errors). This step can be resource intensive if many contacts; you might skip it.
	•	Mark those contacts as linked to the landlord’s WABA so that when the landlord selects a tenant to message, you know which WhatsApp number to send from (the landlord’s).
	•	Consent: Ensure that these tenants have agreed to be contacted via WhatsApp (this is more of a compliance step – perhaps already handled outside this integration). The landlord should have consent from tenants to message them on WhatsApp to comply with WhatsApp policies.

3. Finalize Onboarding – Subscribe App to WABA Webhooks

At this point, the landlord’s WABA and phone are created and linked. Now, enable message delivery for this WABA by subscribing to its webhooks via the API:
	•	Webhook Subscription API: Using the Graph API and an appropriate token, call: POST /<WABA_ID>/subscribed_apps. This subscribes your app to that WABA’s webhook events (such as incoming messages) ￼. For example, using Node (with axios or node-fetch):

await axios.post(`https://graph.facebook.com/v16.0/${wabaId}/subscribed_apps`, null, {
  params: { access_token: FB_TOKEN }
});

(No body payload is needed; the app ID is implied from the token’s context.) This must be done for each landlord’s WABA so that your central webhook callback (configured in the app dashboard) will receive that landlord’s messages. If this call is not made, your webhook will not get any events from that WABA. Important: The token used here must have the whatsapp_business_management permission and access to the WABA (a system user token or the user token who onboarded). If using the landlord’s user token, ensure it’s the one obtained from the OAuth exchange. If using a system user token, that system user must be assigned to the WABA (e.g., as an admin). In some cases, if you forget to subscribe the app or the token lacks permission, you’ll get an error like “Unsupported post request or missing permissions” ￼ – which indicates the need for correct permissions or that the app is not properly added to the WABA. Double-check that your app is listed as a partner integration on the WABA (the embedded flow usually adds it automatically).

	•	Register Phone (if needed): Note: If the embedded flow was executed normally, the phone is already verified. There is an alternate scenario (as referenced in Twilio’s guide) where the embedded signup could skip phone verification (using featureType: 'only_waba_sharing' ￼). In such cases, you would need an extra Graph API step to register the phone via API calls: POST /<PHONE_NUMBER_ID>/request_code (to send OTP) and then POST /<PHONE_NUMBER_ID>/verify_code with the OTP to verify the number ￼. In our plan, we assume the default flow (phone was handled in UI), so no additional registration API call is required. But keep this in mind if ZenRent ever pre-provisions numbers (like using Twilio phone numbers for landlords).

At the end of onboarding, our backend should respond to the front-end that the WhatsApp account is successfully connected. The landlord can now send WhatsApp messages through ZenRent.

Data Model Design (Multi-Tenancy)

Design the data models to clearly separate each landlord’s WhatsApp integration data and to map tenant contacts to the correct landlord WABA:
	•	Landlord WhatsApp Integration: As noted, maintain a table or document linking userId to their WhatsApp credentials. Example (document structure):

{
  "userId": "landlord123",
  "wabaId": "1111222333444455",
  "phoneId": "7889900",
  "phoneNumber": "+14151234567",
  "businessName": "Landlord Inc.",
  "waAccessToken": "<EncryptedTokenString>",
  "status": "connected",
  "connectedAt": "2025-04-03T12:00:00Z"
}

This ensures multi-tenancy isolation: each landlord only sees/sends with their own WABA. Use the userId to query this when the landlord uses WhatsApp features.

	•	Tenant Contacts: If ZenRent already has a tenants table, extend it to include a WhatsApp contact field and an owner (landlord) reference. For example, each tenant record could have whatsappOptIn: true/false and possibly store the WhatsApp phone (if different from their regular phone). However, likely the tenant’s phone is their WhatsApp. Ensure phone numbers are stored in a uniform format (E.164). If a tenant can belong to multiple landlords (unlikely in a rental platform scenario), a mapping table might be needed, but typically tenants are unique to a landlord. You might create a TenantContact model if needed specifically for messaging, containing at least landlordId and phoneNumber (and maybe the tenant’s name for convenience).
	•	Message Logs: It’s recommended to have a Message model to store messages exchanged (with fields like landlordId, tenantPhone, direction (sent/received), messageBody, timestamp, status). This allows ZenRent to display conversation history to landlords and also audit messaging. Webhook events will feed into this log for incoming messages and delivery reports, and outgoing messages can be logged when sent.
	•	Security Considerations: The waAccessToken (if stored per landlord) should be encrypted at rest or not stored if not needed. In many cases, you might not store the user token at all after exchanging for a system token. Instead, store a single system user token (in app config) that is reused. If so, just ensure your system user has access to all WABAs. If using the user token approach, store the token expiration and a refresh mechanism (since user tokens expire ~60 days). You might prompt the landlord to re-connect WhatsApp if needed after expiry.

Sending Messages via WhatsApp Cloud API

Once a landlord is onboarded, they can send messages to their tenants from within ZenRent’s UI. The process flows from frontend to backend to WhatsApp:
	•	Frontend Message UI: ZenRent can provide a chat interface or a simple form for the landlord to compose a message to a tenant. The landlord selects a tenant (or a tenant list) and types a message. When they hit “Send”, the frontend calls a ZenRent API endpoint (e.g., POST /api/whatsapp/sendMessage) with the tenant’s phone number (or an identifier) and the message content. This request should include the landlord’s auth (session or JWT) so the backend knows which user is sending.
	•	Backend SendMessage Endpoint: In Node.js, implement an endpoint (e.g., an Express route or Next.js API route) to handle sending messages. This will:
a. Authenticate the request (ensure the user session or token is valid, and fetch the user’s ID).
b. Retrieve Landlord’s WhatsApp info from DB (using the userId). This yields the phone_number_id and an access token to use.
c. Prepare the WhatsApp API call: Use the Cloud API endpoint to send a message. The Graph API endpoint is POST /<PHONE_NUMBER_ID>/messages ￼. The request body should include messaging_product: "whatsapp", the recipient’s number, and the message type and content. For example, to send a text message:

{
  "messaging_product": "whatsapp",
  "to": "<tenant_phone_E164>",
  "type": "text",
  "text": { "body": "Hello, this is a message from your landlord." }
}

If sending a template (for outside the 24-hour session window), the JSON would use "type": "template" with template name and components. If sending media, include the media ID or URL accordingly.
d. Call the Graph API: Use your backend HTTP client to POST this JSON to https://graph.facebook.com/v16.0/<phone_number_id>/messages with the Authorization header set to Bearer <ACCESS_TOKEN>. The token here must have the whatsapp_business_messaging permission and be authorized for this phone (either the user token from that landlord or the system user token) ￼. For example, using axios:

await axios.post(
  `https://graph.facebook.com/v16.0/${phoneId}/messages`,
  {
    messaging_product: "whatsapp",
    to: tenantPhone,
    type: "text",
    text: { body: messageText }
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

e. Handle Response: On success, Facebook returns a message ID ("messages": [{"id": "..."}]). You can respond to the frontend with success and maybe the message ID. Also log the message in your database (with status “sent”). If there’s an error, handle it: common errors include invalid recipient (e.g., the number isn’t on WhatsApp), template not approved (if using template), or the business has exceeded rate limits or hasn’t an active conversation with the user. Return an error message to the frontend for user feedback (e.g., “Unable to send: the number is not on WhatsApp” or similar).

	•	Session Messaging vs Templates: Educate the landlords (or enforce via UI) about WhatsApp’s messaging rules. If a tenant has not sent a message or it’s been >24 hours since last tenant message, the landlord must use a pre-approved template to initiate or re-initiate conversation. That means ZenRent should either automatically use a default template for first contact (like a rental introduction message) or prevent sending free-form text outside the session window. The Cloud API will reject non-template messages outside the 24-hour session. To implement this, you can track last message times per tenant or check the error responses from the API (which will indicate a template is needed). Templates can be managed via the WhatsApp Business Manager or Template APIs; ensure the landlord’s WABA has any needed templates created (perhaps ZenRent as tech provider can pre-load common templates or provide a UI for template management – though that is beyond initial integration scope).
	•	Multiple Recipients / Bulk: Initially, implement one-to-one messaging. If ZenRent wants to allow a landlord to blast a message to multiple tenants, you would loop over recipients and call the API for each (WhatsApp Cloud API doesn’t support true bulk sending in one call). Be mindful of rate limits (there are per-second call limits depending on tier).
	•	Testing: During development, use a test phone number provided by the WhatsApp sandbox (and test recipients limited to 5 numbers until you switch to a real number ￼). Once the landlord’s real number is added, the 5-recipient limit is lifted ￼. Always test sending with known WhatsApp contacts to ensure your formatting and authentication are correct.

Receiving Messages: Webhook Implementation

To receive incoming WhatsApp messages (from tenants to landlords) and delivery/read status updates, implement a webhook endpoint on the backend and connect it to your system:
	•	Webhook Endpoint: Create an endpoint in Node (e.g., /webhook/whatsapp) that will handle GET (for verification) and POST (for notifications). This could be an Express route or Next.js API route. For example, in Express:

app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
app.post('/webhook/whatsapp', (req, res) => {
  const body = req.body;
  // Parse the incoming message or status
  if (body.entry) {
    for (let entry of body.entry) {
      const changes = entry.changes || [];
      changes.forEach(change => {
        if (change.value && change.field === 'messages') {
          // Process message 
          const msg = change.value;
          // ... handle message (detailed below)
        }
      });
    }
  }
  res.sendStatus(200); // Respond quickly to acknowledge
});

Ensure the request body is parsed as JSON. (If using Express, use app.use(express.json()) with the correct verification of Facebook signature if needed. In Next.js API route, you might need to disable the default body parser to handle the raw body if validating signature, but you can rely on the verification token for basic security.) The VERIFY_TOKEN is an arbitrary secret string you set in the Facebook app webhook configuration and also have in your server config, used here to validate the initial setup challenge.

	•	Processing Incoming Messages: The POST payload from WhatsApp Cloud API will contain one or more entry objects, which contain changes. Each change will have a field (for WhatsApp it’s typically "messages" for actual new messages) and a value object. The value will include the details of the message and the business context. For example, an incoming text message from a tenant looks like:

{
  "field": "messages",
  "value": {
    "messaging_product": "whatsapp",
    "metadata": {
       "phone_number_id": "7889900",    // the ZenRent landlord's phone ID
       "display_phone_number": "+14151234567"
    },
    "contacts": [ { "wa_id": "15557654321", "profile": { "name": "Tenant Name"} } ],
    "messages": [ 
      { "from": "15557654321", "id": "ABCD...,", "timestamp": "1680538745", "text": { "body": "Hello!" }, "type": "text" }
    ]
  }
}

We need to extract the phone_number_id (to know which landlord’s number was contacted) and the message details. Using the phone_number_id, look up which landlord this corresponds to (in our stored integrations). For example, if phone_number_id is 7889900 and we know that belongs to userId = landlord123, then we know this message is for that landlord. Next, get the sender’s number (messages[0].from) which is the tenant’s WhatsApp number (in international format without +). This should match one of the landlord’s tenants. You can look up the tenant by phone in your contacts database to get the tenant’s name or internal ID if needed. The message content is in messages[0].text.body (for text messages).
	•	Saving and Notifying: Store the incoming message in the Message log (mark it as incoming, and perhaps set status as “unread”). You can then notify the landlord in real-time. For example, if ZenRent has a WebSocket or push notification mechanism (maybe using Next.js API routes with SSE or a pub-sub to the client), you could push this new message to the landlord’s UI so it appears instantly. If not, the landlord’s front-end could periodically poll an endpoint to get new messages. Real-time update is preferable for a chat experience.
	•	Auto-replies or Bots: (Optional) ZenRent might implement automated replies or trigger certain workflows based on keywords. This is beyond the core scope, but the webhook is where you would implement any automation (e.g., if tenant sends “help”, the system could respond with a FAQ message via the send API). Keep it simple initially: just log and forward messages.

	•	Processing Status Updates: The webhook will also receive events for message status (sent, delivered, read) under the same messages field but the messages array would contain objects with type: "reaction" or type: "delivery" etc. These include an id which corresponds to the message ID you sent. You can use these to update the message status in your logs (e.g., mark message as delivered or read). For example, a delivered status might come as:

"statuses": [ { "id": "ABCD...", "status": "delivered", "timestamp": "1680538800" } ]

You’d find the message in your DB by that ID and update its status. Subscribing to statuses is usually covered when you subscribe to messages (they come under the same webhook). If needed, also subscribe to the message_reactions and message_reads fields in your webhook config to get read receipts.

	•	Responding to Webhook: Always respond with HTTP 200 OK quickly (within a few seconds) to acknowledge receipt. If processing is intensive, handle asynchronously because if you don’t ACK within ~10 seconds, Facebook will retry the webhook delivery. You can offload processing to a job queue if needed, but in our case processing is light (DB inserts and perhaps a WebSocket emit).
	•	Security: The verify token method ensures the endpoint is hit by Facebook during registration. In production, you should also verify the signature of incoming webhook events (Facebook sends an X-Hub-Signature-256 header). Using your app’s secret, you can HMAC verify the payload to ensure it truly came from Facebook. This prevents malicious actors from hitting your webhook endpoint with fake data. Implementing this is optional but recommended. (Since this is a technical plan, one could include this for completeness).
	•	Multi-Tenant Handling: Because this is a single webhook endpoint for all landlords, we rely on the phone_number_id in each message to route to the correct landlord. Our earlier design to store phone_number_id per landlord enables this. Ensure this mapping is efficient (index the phoneId in the DB). If a message comes in for an unknown phone_number_id (not found in DB), possibly handle it as an error or ignore – it means our app got a webhook for an asset we didn’t register (unlikely if everything is scoped to known landlords).

End-to-End Code Architecture Suggestions

To integrate this cleanly into the ZenRent codebase, consider the following architectural suggestions:
	•	Organize WhatsApp Logic into Modules: Create a service module, e.g., services/whatsappService.js (or TypeScript file), that encapsulates WhatsApp API calls (send message, etc.) and perhaps the onboarding Graph API calls. This keeps your route handlers thin. For example, whatsappService.exchangeCodeForToken(code), whatsappService.subscribeAppToWABA(wabaId, token), whatsappService.sendMessage(phoneId, toNumber, content, token), etc. The ZenRent backend can call these functions from the appropriate controllers.
	•	Routes/Controllers: If ZenRent’s Node backend uses Express, define routes like:
	•	POST /api/whatsapp/onboard -> controller that calls exchangeCodeForToken, fetchWABAInfo, fetchPhoneInfo, subscribeAppToWABA, saves to DB, and returns success.
	•	POST /api/whatsapp/sendMessage -> controller that calls whatsappService.sendMessage and handles response.
	•	GET/POST /webhook/whatsapp -> controllers as described for verification and events.
In Next.js, the equivalent would be API route files under pages/api/whatsapp/ (e.g., onboard.js, sendMessage.js, webhook.js). These can use the same service functions. Note: Next.js API routes run per request; if you need persistent connections (for webhook verifying signature), you can still do it within the route handler by reading req.body and req.headers.
	•	Environment Configuration: Store the Facebook App ID, App Secret, the Verify Token, and any system user access tokens in environment variables (e.g., in Next, use .env.local for development). ZenRent’s backend should load these and use accordingly. Also store the Graph API version your app will use (e.g., v16.0 or v17.0) in a config constant to easily upgrade.
	•	Example Integration in ZenRent Codebase: Suppose ZenRent has a user model and uses a MongoDB through Mongoose. You might add a sub-document for WhatsApp or a new model as discussed. Integration points: after a landlord signs up for ZenRent, they can click Connect WhatsApp -> triggers the front-end flow -> backend saves WABA. From then on, when the landlord views a tenant conversation page, your front-end could call an API like /api/whatsapp/conversations?tenantId=XYZ to fetch any saved messages or start a new chat (which behind the scenes is just a logical grouping by tenant). This API would use the Message log and contact mapping. When the landlord sends a message via the UI, it calls the send route. When a message comes in via webhook, if you have a WebSocket (perhaps using library like Socket.IO or Next.js built-in support with SSE), you would emit an event to the landlord’s browser session (perhaps identified by userId) to inform them of the new message. This provides a near real-time chat experience.
	•	Facebook App Permissions and Testing: During development, use a test user or test phone (provided in Meta developer dashboard) for sending messages. Add your developer account as a tester to the app so you can complete the embedded signup in dev mode. Once ready for production, ensure the app is live and permissions approved so real landlords (non-developer users) can authorize. Also, monitor the rate limits and messaging limits: a newly created WABA usually starts in Tier 1 (can send messages to 1K unique recipients per day) and scales up as quality and volume increase ￼. This should be plenty for typical landlord use cases, but it’s good to be aware.
	•	Logging and Error Handling: Implement robust logging around the WhatsApp integration points. For example, log when a landlord starts the embedded signup, and if any Graph API call fails (with error details). This will help in debugging issues with the Meta API. Facebook error messages can be cryptic (as seen in some StackOverflow posts) so capturing them will assist in resolving permission or setup problems.
	•	Reference Documentation: Keep Meta’s official WhatsApp Business API reference at hand ￼ for specifics on message payloads, and the Embedded Signup guides for any changes in the onboarding process. Meta may update requirements (for example, the sessionInfoVersion might change in future or new webhooks fields may be introduced).

By following this plan, ZenRent’s platform will allow each landlord to seamlessly connect their WhatsApp Business account through an embedded flow, automatically sync their tenant contacts (in the backend), and send/receive WhatsApp messages. Each landlord’s data remains isolated (multi-tenant), identified by their auth.user.id and associated WhatsApp IDs. The integration leverages the official WhatsApp Cloud API endpoints for messaging and uses webhooks for real-time incoming message delivery, aligned with Meta’s best practices for tech providers.

Sources: Meta WhatsApp API documentation ￼ and developer community insights ￼ have been referenced to ensure the implementation meets current guidelines and uses the correct endpoints and permissions. This plan provides a full-stack blueprint to integrate WhatsApp into ZenRent, allowing landlords and tenants to communicate efficiently on a platform they already use daily (WhatsApp), all orchestrated through ZenRent’s system.
