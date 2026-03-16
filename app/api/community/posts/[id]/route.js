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

export async function GET(request, { params }) {
  try {
    const { id } = params
    const database = await connectDB()

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const commentCount = await database.collection('community_comments').countDocuments({ postId: id })

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { _id, upvotes, ...cleanPost } = post
    return NextResponse.json({
      ...cleanPost,
      commentCount,
      userUpvoted: userId ? (upvotes || []).includes(userId) : false,
    })
  } catch (err) {
    console.error('Get post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const database = await connectDB()

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await database.collection('community_posts').deleteOne({ id })
    await database.collection('community_comments').deleteMany({ postId: id })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
