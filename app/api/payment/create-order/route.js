import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { MongoClient } from 'mongodb'

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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, currency = 'INR', orderId, notes } = body

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: orderId || `receipt_${Date.now()}`,
      notes: notes || {},
    })

    // Store in database
    const db = await connectToMongo()
    await db.collection('razorpay_orders').insertOne({
      razorpayOrderId: razorpayOrder.id,
      orderId,
      amount,
      currency,
      status: 'created',
      userId: session.user.id,
      createdAt: new Date(),
    })

    return NextResponse.json(razorpayOrder)
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order', message: error.message },
      { status: 500 }
    )
  }
}
