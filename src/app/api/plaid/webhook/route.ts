import { NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { WebhookType } from 'plaid'

export async function POST(request: Request) {
  try {
    const supabase = createClientComponentClient()
    const webhookData = await request.json()

    console.log('Received Plaid webhook:', webhookData)

    // Handle different webhook types
    switch (webhookData.webhook_type) {
      case WebhookType.Auth:
        // Handle auth updates
        break
      
      case WebhookType.Transactions:
        // Handle transaction updates
        if (webhookData.webhook_code === 'TRANSACTIONS_SYNC') {
          // Update transactions in your database
          const { error } = await supabase
            .from('plaid_webhooks')
            .insert({
              webhook_type: webhookData.webhook_type,
              webhook_code: webhookData.webhook_code,
              item_id: webhookData.item_id,
              data: webhookData
            })

          if (error) {
            console.error('Error storing webhook:', error)
          }
        }
        break

      default:
        console.log('Unhandled webhook type:', webhookData.webhook_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
} 