import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'

let client
let db

async function connectToMongo() {
  if (!client) {
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL is not defined in environment')
    }
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update payment status in database
    const db = await connectToMongo()
    
    // Update razorpay_orders collection
    await db.collection('razorpay_orders').updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'paid',
          paidAt: new Date(),
        },
      }
    )

    // Update main orders collection
    if (orderId) {
      await db.collection('orders').updateOne(
        { id: orderId },
        {
          $set: {
            paymentStatus: 'paid',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            paidAt: new Date(),
          },
        }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully',
      orderId 
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', message: error.message },
      { status: 500 }
    )
  }
}
