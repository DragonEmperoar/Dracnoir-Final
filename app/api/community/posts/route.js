import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

let client, db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function GET(request) {
  try {
    const database = await connectDB()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query = {}
    if (category && category !== 'all') {
      query.category = category
    }

    const sortObj = sort === 'trending'
      ? { upvoteCount: -1, createdAt: -1 }
      : { createdAt: -1 }

    const posts = await database.collection('community_posts')
      .find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const total = await database.collection('community_posts').countDocuments(query)

    // Get comment counts
    const postIds = posts.map(p => p.id)
    const commentCounts = await database.collection('community_comments').aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]).toArray()
    const commentCountMap = {}
    commentCounts.forEach(c => { commentCountMap[c._id] = c.count })

    const session = await getServerSession(authOptions).catch(() => null)
    const userId = session?.user?.id || null

    const cleaned = posts.map(({ _id, ...p }) => ({
      ...p,
      commentCount: commentCountMap[p.id] || 0,
      userUpvoted: userId ? (p.upvotes || []).includes(userId) : false,
      upvotes: undefined,
    }))

    return NextResponse.json({ posts: cleaned, total, page, limit })
  } catch (err) {
    console.error('Community posts GET error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const database = await connectDB()
    const body = await request.json()
    const { title, content, category, image } = body

    if (!title?.trim() || !content?.trim() || !category) {
      return NextResponse.json({ error: 'Title, content and category are required' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 })
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 })
    }

    // Rate limit: max 5 posts per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await database.collection('community_posts').countDocuments({
      userId: session.user.id,
      createdAt: { $gte: oneHourAgo }
    })
    if (recentCount >= 5) {
      return NextResponse.json({ error: 'Post limit reached. Max 5 posts per hour.' }, { status: 429 })
    }

    const post = {
      id: uuidv4(),
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      userImage: session.user.image || null,
      title: title.trim(),
      content: content.trim(),
      category,
      image: image?.trim() || null,
      upvotes: [],
      upvoteCount: 0,
      createdAt: new Date(),
    }

    await database.collection('community_posts').insertOne(post)
    const { _id, upvotes, ...cleanPost } = post
    return NextResponse.json(cleanPost, { status: 201 })
  } catch (err) {
    console.error('Community posts POST error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
