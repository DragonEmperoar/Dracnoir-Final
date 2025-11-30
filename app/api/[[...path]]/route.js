export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
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
        price: 2399,
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
        price: 3199,
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
        price: 10399,
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
      {
        id: uuidv4(),
        slug: 'forest-guardian-sustainable-figure',
        title: 'Forest Guardian Sustainable Figure',
        price: 7199,
        description:
          'Eco-friendly collectible crafted with recycled materials and minimal packaging.',
        categoryId: figuresCat.id,
        categorySlug: figuresCat.slug,
        material: 'Recycled PVC blend',
        dimensions: '22cm x 14cm',
        series: 'Verdant Spirits',
        images: ['https://images.unsplash.com/photo-1590708622734-b1b8df3c3576'],
        rating: 4.7,
        reviewCount: 21,
        createdAt: now,
        popularity: 88,
        type: 'action-figure',
        subcategory: 'sustainable',
      },
    ]

    await categoriesCol.insertMany(categories)
    await productsCol.insertMany(products)
  }

  // Ensure at least one sustainable figure exists for demos
  const sustainableExists = await productsCol.findOne({
    type: 'action-figure',
    subcategory: 'sustainable',
  })
  if (!sustainableExists) {
    const figuresCatDoc = await categoriesCol.findOne({ slug: 'action-figures' })
    if (figuresCatDoc) {
      const now = new Date()
      await productsCol.insertOne({
        id: uuidv4(),
        slug: 'forest-guardian-sustainable-figure',
        title: 'Forest Guardian Sustainable Figure',
        price: 7199,
        description:
          'Eco-friendly collectible crafted with recycled materials and minimal packaging.',
        categoryId: figuresCatDoc.id,
        categorySlug: figuresCatDoc.slug,
        material: 'Recycled PVC blend',
        dimensions: '22cm x 14cm',
        series: 'Verdant Spirits',
        images: ['https://images.unsplash.com/photo-1590708622734-b1b8df3c3576'],
        rating: 4.7,
        reviewCount: 21,
        createdAt: now,
        popularity: 88,
        type: 'action-figure',
        subcategory: 'sustainable',
      })
    }
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

    // CART ENDPOINTS (auth required)
    if (route === '/cart' && method === 'GET') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const cartsCol = db.collection('carts')
      let cart = await cartsCol.findOne({ userId })
      if (!cart) {
        cart = { id: uuidv4(), userId, items: [], createdAt: new Date(), updatedAt: new Date() }
        await cartsCol.insertOne(cart)
      }
      const { _id, ...rest } = cart
      return handleCORS(NextResponse.json(rest))
    }

    if (route === '/cart/items' && method === 'POST') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const body = await request.json()
      const { productId, productSlug, quantity = 1, variantId = null } = body || {}
      if (!productId && !productSlug) {
        return handleCORS(
          NextResponse.json({ error: 'productId or productSlug required' }, { status: 400 }),
        )
      }

      const productsCol = db.collection('products')
      const product = productId
        ? await productsCol.findOne({ id: productId })
        : await productsCol.findOne({ slug: productSlug })

      if (!product) {
        return handleCORS(
          NextResponse.json({ error: 'Product not found' }, { status: 404 }),
        )
      }

      const cartsCol = db.collection('carts')
      let cart = await cartsCol.findOne({ userId })
      if (!cart) {
        cart = { id: uuidv4(), userId, items: [], createdAt: new Date(), updatedAt: new Date() }
        await cartsCol.insertOne(cart)
      }

      const items = cart.items || []
      const existingIndex = items.findIndex(
        (it) => it.productId === product.id && it.variantId === variantId,
      )

      const safeQty = Math.max(1, Number(quantity) || 1)

      if (existingIndex >= 0) {
        items[existingIndex].quantity += safeQty
      } else {
        items.push({
          id: uuidv4(),
          productId: product.id,
          productSlug: product.slug,
          title: product.title,
          price: product.price,
          image: product.images?.[0] || null,
          quantity: safeQty,
          variantId,
          addedAt: new Date(),
        })
      }

      await cartsCol.updateOne(
        { id: cart.id },
        { $set: { items, updatedAt: new Date() } },
      )

      const updated = await cartsCol.findOne({ id: cart.id })
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    if (route === '/cart/items' && method === 'DELETE') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const body = await request.json()
      const { itemId } = body || {}
      if (!itemId) {
        return handleCORS(
          NextResponse.json({ error: 'itemId required' }, { status: 400 }),
        )
      }
      const cartsCol = db.collection('carts')
      const cart = await cartsCol.findOne({ userId })
      if (!cart) {
        return handleCORS(
          NextResponse.json({ error: 'Cart not found' }, { status: 404 }),
        )
      }
      const items = (cart.items || []).filter((it) => it.id !== itemId)
      await cartsCol.updateOne(
        { id: cart.id },
        { $set: { items, updatedAt: new Date() } },
      )
      const updated = await cartsCol.findOne({ id: cart.id })
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // ADDRESS ENDPOINTS (auth required)
    if (route === '/addresses' && method === 'GET') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const col = db.collection('addresses')
      const docs = await col
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()
      const cleaned = docs.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/addresses' && method === 'POST') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const body = await request.json()
      const now = new Date()
      const address = {
        id: uuidv4(),
        userId,
        label: body.label || 'Home',
        name: body.name || '',
        phone: body.phone || '',
        line1: body.line1 || '',
        line2: body.line2 || '',
        city: body.city || '',
        state: body.state || '',
        postalCode: body.postalCode || '',
        country: body.country || '',
        isDefault: Boolean(body.isDefault),
        createdAt: now,
        updatedAt: now,
      }
      const col = db.collection('addresses')
      if (address.isDefault) {
        await col.updateMany({ userId }, { $set: { isDefault: false } })
      }
      await col.insertOne(address)
      const { _id, ...rest } = address
      return handleCORS(NextResponse.json(rest))
    }

    if (segments[0] === 'addresses' && segments.length === 2) {
      const addressId = segments[1]
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const col = db.collection('addresses')

      if (method === 'PUT') {
        const body = await request.json()
        const update = {
          label: body.label,
          name: body.name,
          phone: body.phone,
          line1: body.line1,
          line2: body.line2,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          country: body.country,
          updatedAt: new Date(),
        }
        if (body.isDefault != null) {
          const isDefault = Boolean(body.isDefault)
          if (isDefault) {
            await col.updateMany({ userId }, { $set: { isDefault: false } })
          }
          update.isDefault = isDefault
        }
        await col.updateOne({ id: addressId, userId }, { $set: update })
        const updated = await col.findOne({ id: addressId, userId })
        if (!updated) {
          return handleCORS(
            NextResponse.json({ error: 'Not found' }, { status: 404 }),
          )
        }
        const { _id, ...rest } = updated
        return handleCORS(NextResponse.json(rest))
      }

      if (method === 'DELETE') {
        await col.deleteOne({ id: addressId, userId })
        return handleCORS(NextResponse.json({ success: true }))
      }
    }

    // ORDERS ENDPOINTS (auth required)
    if (route === '/orders' && method === 'GET') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const col = db.collection('orders')
      const docs = await col
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray()
      const cleaned = docs.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/orders' && method === 'POST') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const body = await request.json()
      const { addressId } = body || {}

      const cartsCol = db.collection('carts')
      const cart = await cartsCol.findOne({ userId })
      if (!cart || !cart.items || cart.items.length === 0) {
        return handleCORS(
          NextResponse.json({ error: 'Cart is empty' }, { status: 400 }),
        )
      }

      const addrCol = db.collection('addresses')
      const address = await addrCol.findOne({ id: addressId, userId })
      if (!address) {
        return handleCORS(
          NextResponse.json({ error: 'Address not found' }, { status: 400 }),
        )
      }

      const subtotal = (cart.items || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0,
      )

      const ordersCol = db.collection('orders')
      const now = new Date()
      const order = {
        id: uuidv4(),
        userId,
        items: cart.items,
        addressSnapshot: {
          label: address.label,
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        subtotal,
        status: 'placed',
        createdAt: now,
        updatedAt: now,
      }

      await ordersCol.insertOne(order)
      // Clear cart after order
      await cartsCol.updateOne(
        { id: cart.id },
        { $set: { items: [], updatedAt: new Date() } },
      )

      const { _id, ...rest } = order
      return handleCORS(NextResponse.json(rest))
    }

    if (segments[0] === 'orders' && segments.length === 2 && method === 'GET') {
      const orderId = segments[1]
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      const ordersCol = db.collection('orders')
      const order = await ordersCol.findOne({ id: orderId, userId })
      if (!order) {
        return handleCORS(
          NextResponse.json({ error: 'Order not found' }, { status: 404 }),
        )
      }
      const { _id, ...rest } = order
      return handleCORS(NextResponse.json(rest))
    }

    // GET /api/coupons/validate?code=XXXX
    if (segments[0] === 'coupons' && segments[1] === 'validate' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const code = searchParams.get('code')
      
      if (!code) {
        return handleCORS(
          NextResponse.json({ error: 'Coupon code required' }, { status: 400 }),
        )
      }
      
      // Mock coupon validation - in production, this would check a coupons collection
      const validCoupons = {
        'ANIME10': { code: 'ANIME10', discount: 10, description: '10% off' },
        'DRACNOIR15': { code: 'DRACNOIR15', discount: 15, description: '15% off' },
        'WELCOME20': { code: 'WELCOME20', discount: 20, description: '20% off for new users' },
      }
      
      const coupon = validCoupons[code.toUpperCase()]
      
      if (!coupon) {
        return handleCORS(
          NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 }),
        )
      }
      
      return handleCORS(NextResponse.json(coupon))
    }

    // GET /api/users (admin only)
    if (route === '/users' && method === 'GET') {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }
      
      // Admin check
      const usersCol = db.collection('users')
      const currentUser = await usersCol.findOne({ id: userId })
      
      if (!currentUser || !currentUser.isAdmin) {
        return handleCORS(
          NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
        )
      }
      
      // Use aggregation pipeline to fetch users with order stats in a single query
      const usersWithStats = await usersCol
        .aggregate([
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: 100 // Limit to 100 users for performance
          },
          {
            $lookup: {
              from: 'orders',
              localField: 'id',
              foreignField: 'userId',
              as: 'orders'
            }
          },
          {
            $addFields: {
              orderCount: { $size: '$orders' },
              totalSpent: {
                $sum: '$orders.subtotal'
              }
            }
          },
          {
            $project: {
              id: 1,
              name: 1,
              email: 1,
              image: 1,
              createdAt: 1,
              emailVerified: 1,
              orderCount: 1,
              totalSpent: 1
            }
          }
        ])
        .toArray()
      
      return handleCORS(NextResponse.json(usersWithStats))
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

    // POST /api/products/[slug]/reviews
    if (
      segments[0] === 'products' &&
      segments.length === 3 &&
      segments[2] === 'reviews' &&
      method === 'POST'
    ) {
      const userId = await requireUserId(request)
      if (!userId) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        )
      }

      const slug = segments[1]
      const body = await request.json()
      const { rating, title, text } = body

      if (!rating || !text) {
        return handleCORS(
          NextResponse.json({ error: 'Rating and review text are required' }, { status: 400 }),
        )
      }

      if (rating < 1 || rating > 5) {
        return handleCORS(
          NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 }),
        )
      }

      const productsCol = db.collection('products')
      const product = await productsCol.findOne({ slug })
      if (!product) {
        return handleCORS(
          NextResponse.json({ error: 'Product not found' }, { status: 404 }),
        )
      }

      // Get user details
      const usersCol = db.collection('users')
      const user = await usersCol.findOne({ id: userId })

      const reviewsCol = db.collection('reviews')
      const newReview = {
        id: uuidv4(),
        productId: product.id,
        userId,
        userName: user?.name || 'Anonymous',
        rating: Number(rating),
        title: title || '',
        text,
        createdAt: new Date(),
      }

      await reviewsCol.insertOne(newReview)

      // Update product review count and average rating
      const allReviews = await reviewsCol.find({ productId: product.id }).toArray()
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await productsCol.updateOne(
        { id: product.id },
        { 
          $set: { 
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: allReviews.length 
          } 
        }
      )

      const { _id, ...reviewResponse } = newReview
      return handleCORS(NextResponse.json(reviewResponse), { status: 201 })
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
      const reviewsColInstance = db.collection('reviews')
      const docs = await reviewsColInstance
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
