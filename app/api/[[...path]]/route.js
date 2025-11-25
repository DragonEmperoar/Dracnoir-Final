import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

// MongoDB connection (reused across requests)
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

// Helper: CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Seed minimal demo data if empty
async function ensureSeedData(db) {
  const productsCol = db.collection('products')
  const categoriesCol = db.collection('categories')
  const reviewsCol = db.collection('reviews')

  const categoriesCount = await categoriesCol.countDocuments()
  const productsCount = await productsCol.countDocuments()

  // Seed categories + products once when both collections are empty
  if (categoriesCount === 0 && productsCount === 0) {
    const categories = [
      { id: uuidv4(), slug: 'plushes', name: 'Plushes' },
      { id: uuidv4(), slug: 't-shirts', name: 'T-Shirts' },
      { id: uuidv4(), slug: 'action-figures', name: 'Action Figures' },
    ]

    const [plushCat, tshirtCat, figuresCat] = categories
    const now = new Date()

    const products = [
      {
        id: uuidv4(),
        slug: 'chibi-hero-plush',
        title: 'Chibi Hero Plush',
        price: 29.99,
        description:
          'Super-soft chibi hero plush with oversized head and embroidered details.',
        categoryId: plushCat.id,
        categorySlug: plushCat.slug,
        material: 'Premium polyester',
        dimensions: '20cm x 12cm',
        series: 'My Hero Plushademia',
        images: [
          'https://images.unsplash.com/photo-1590708622734-b1b8df3c3576',
          'https://images.unsplash.com/photo-1707602985834-eca0a6d63b2f',
        ],
        rating: 4.8,
        reviewCount: 32,
        createdAt: now,
        popularity: 90,
        type: 'plush',
      },
      {
        id: uuidv4(),
        slug: 'neon-mecha-tee',
        title: 'Neon Mecha Oversized Tee',
        price: 39.99,
        description:
          'Streetwear-inspired oversized tee featuring a neon mecha print.',
        categoryId: tshirtCat.id,
        categorySlug: tshirtCat.slug,
        material: '100% cotton',
        dimensions: 'Unisex fit',
        series: 'Neon Mecha Uprising',
        images: ['https://images.unsplash.com/photo-1735720518679-4c0673e59035'],
        rating: 4.6,
        reviewCount: 18,
        createdAt: now,
        popularity: 80,
        type: 'tshirt',
        variants: [
          {
            id: uuidv4(),
            fit: 'Oversized',
            size: 'M',
            color: 'Black',
            stock: 25,
          },
          {
            id: uuidv4(),
            fit: 'Regular',
            size: 'L',
            color: 'White',
            stock: 10,
          },
        ],
      },
      {
        id: uuidv4(),
        slug: 'dragon-summoner-premium-figure',
        title: 'Dragon Summoner Premium Figure',
        price: 129.99,
        description:
          'High-detail PVC figure with translucent dragon effects and dynamic pose.',
        categoryId: figuresCat.id,
        categorySlug: figuresCat.slug,
        material: 'PVC + ABS',
        dimensions: '28cm x 18cm',
        series: 'Dragon Summoner Chronicles',
        images: ['https://images.unsplash.com/photo-1590708622734-b1b8df3c3576'],
        rating: 4.9,
        reviewCount: 54,
        createdAt: now,
        popularity: 95,
        type: 'action-figure',
        subcategory: 'premium',
      },
    ]

    await categoriesCol.insertMany(categories)
    await productsCol.insertMany(products)
  }

  // Seed a few demo reviews if none exist
  const reviewsCount = await reviewsCol.countDocuments()
  if (reviewsCount === 0) {
    const products = await productsCol.find({}).toArray()
    const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]))
    const now = new Date()

    const demoReviews = []

    if (bySlug['chibi-hero-plush']) {
      const p = bySlug['chibi-hero-plush']
      demoReviews.push(
        {
          id: uuidv4(),
          productId: p.id,
          productSlug: p.slug,
          rating: 5,
          title: 'Peak cuddle energy',
          text: 'Even softer than it looks. Perfect for late-night anime marathons.',
          createdAt: now,
        },
        {
          id: uuidv4(),
          productId: p.id,
          productSlug: p.slug,
          rating: 4,
          title: 'Great gift',
          text: 'Got this for a friend, they absolutely loved it!',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
        },
      )
    }

    if (bySlug['neon-mecha-tee']) {
      const p = bySlug['neon-mecha-tee']
      demoReviews.push({
        id: uuidv4(),
        productId: p.id,
        productSlug: p.slug,
        rating: 5,
        title: 'My new con fit',
        text: 'Print quality is insane and the oversized fit is perfect.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
      })
    }

    if (bySlug['dragon-summoner-premium-figure']) {
      const p = bySlug['dragon-summoner-premium-figure']
      demoReviews.push({
        id: uuidv4(),
        productId: p.id,
        productSlug: p.slug,
        rating: 5,
        title: 'Centerpiece of my shelf',
        text: 'The translucent effects look wild under RGB lighting.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
      })
    }

    if (demoReviews.length > 0) {
      await reviewsCol.insertMany(demoReviews)
    }
  }
}

// Helpers for listing products with basic filters
function buildProductQuery(params) {
  const query = {}
  if (params.get('categorySlug')) {
    query.categorySlug = params.get('categorySlug')
  }
  if (params.get('series')) {
    query.series = params.get('series')
  }
  if (params.get('minPrice') || params.get('maxPrice')) {
    query.price = {}
    if (params.get('minPrice')) query.price.$gte = Number(params.get('minPrice'))
    if (params.get('maxPrice')) query.price.$lte = Number(params.get('maxPrice'))
  }
  if (params.get('subcategory')) {
    query.subcategory = params.get('subcategory')
  }
  if (params.get('search')) {
    const s = params.get('search')
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { series: { $regex: s, $options: 'i' } },
    ]
  }
  return query
}

function buildProductSort(params) {
  const sortParam = params.get('sort') || 'popularity'
  switch (sortParam) {
    case 'price-asc':
      return { price: 1 }
    case 'price-desc':
      return { price: -1 }
    case 'newest':
      return { createdAt: -1 }
    case 'popularity':
    default:
      return { popularity: -1 }
  }
}

async function requireUserId(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return session.user.id
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method
  const segments = route.split('/').filter(Boolean)

  try {
    const db = await connectToMongo()
    await ensureSeedData(db)

    // Root test endpoint (for the old home test)
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(
        NextResponse.json({ message: 'Hello World from Anime Store API' }),
      )
    }

    // GET /api/categories
    if (route === '/categories' && method === 'GET') {
      const categories = await db.collection('categories').find({}).toArray()
      const cleaned = categories.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    // GET /api/products (listing with filters & pagination)
    if (route === '/products' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const page = Number(searchParams.get('page') || '1')
      const limit = Math.min(Number(searchParams.get('limit') || '12'), 50)

      const query = buildProductQuery(searchParams)
      const sort = buildProductSort(searchParams)

      const col = db.collection('products')
      const total = await col.countDocuments(query)
      const items = await col
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

      const cleaned = items.map(({ _id, ...rest }) => rest)

      return handleCORS(
        NextResponse.json({
          items: cleaned,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        }),
      )
    }

    // GET /api/products/[slug]/reviews
    if (
      segments[0] === 'products' &&
      segments.length === 3 &&
      segments[2] === 'reviews' &&
      method === 'GET'
    ) {
      const slug = segments[1]
      const productsCol = db.collection('products')
      const product = await productsCol.findOne({ slug })
      if (!product) {
        return handleCORS(
          NextResponse.json({ error: 'Product not found' }, { status: 404 }),
        )
      }
      const reviewsCol = db.collection('reviews')
      const docs = await reviewsCol
        .find({ productId: product.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()
      const cleaned = docs.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    // GET /api/products/[slug]
    if (segments[0] === 'products' && segments.length === 2 && method === 'GET') {
      const slug = segments[1]
      const product = await db.collection('products').findOne({ slug })
      if (!product) {
        return handleCORS(
          NextResponse.json({ error: 'Product not found' }, { status: 404 }),
        )
      }
      const { _id, ...rest } = product
      return handleCORS(NextResponse.json(rest))
    }

    // Fallback
    return handleCORS(
      NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }),
    )
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    )
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
