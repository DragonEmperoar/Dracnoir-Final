import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'

let client, db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const database = await connectDB()
    const comments = await database.collection('community_comments')
      .find({ postId: id })
      .sort({ createdAt: 1 })
      .toArray()
    return NextResponse.json(comments.map(({ _id, ...c }) => c))
  } catch (err) {
    console.error('Get comments error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const database = await connectDB()
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment text required' }, { status: 400 })
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 })
    }

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Rate limit: max 10 comments per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await database.collection('community_comments').countDocuments({
      userId: session.user.id,
      createdAt: { $gte: oneHourAgo }
    })
    if (recentCount >= 10) {
      return NextResponse.json({ error: 'Comment limit reached. Max 10 per hour.' }, { status: 429 })
    }

    const comment = {
      id: uuidv4(),
      postId: id,
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      userImage: session.user.image || null,
      content: content.trim(),
      createdAt: new Date(),
    }

    await database.collection('community_comments').insertOne(comment)
    const { _id, ...clean } = comment
    return NextResponse.json(clean, { status: 201 })
  } catch (err) {
    console.error('Add comment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
