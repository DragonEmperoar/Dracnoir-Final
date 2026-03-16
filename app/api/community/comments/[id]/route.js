import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

let client, db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const database = await connectDB()

    const comment = await database.collection('community_comments').findOne({ id })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await database.collection('community_comments').deleteOne({ id })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete comment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
