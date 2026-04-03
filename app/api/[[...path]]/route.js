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

  // Seed demo coupons if none exist
  const couponsCount = await db.collection('coupons').countDocuments()
  if (couponsCount === 0) {
    const now = new Date()
    await db.collection('coupons').insertMany([
      { id: uuidv4(), code: 'ANIME10', type: 'percentage', value: 10, minOrder: 0, description: '10% off sitewide', isActive: true, expiryDate: null, usageCount: 0, createdAt: now },
      { id: uuidv4(), code: 'DRACNOIR15', type: 'percentage', value: 15, minOrder: 500, description: '15% off on orders above ₹500', isActive: true, expiryDate: null, usageCount: 0, createdAt: now },
      { id: uuidv4(), code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 0, description: '20% off for new users', isActive: true, expiryDate: null, usageCount: 0, createdAt: now },
      { id: uuidv4(), code: 'FLAT200', type: 'flat', value: 200, minOrder: 1000, description: '₹200 off on orders above ₹1000', isActive: true, expiryDate: null, usageCount: 0, createdAt: now },
    ])
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

const ADMIN_EMAILS = ['chirayu1264@gmail.com']

async function requireAdmin(request, db) {
  // Check admin session cookie (username/password login)
  const adminSessionCookie = request.cookies?.get?.('admin_session')
  if (adminSessionCookie?.value) {
    const adminSessionsCol = db.collection('admin_sessions')
    const adminSession = await adminSessionsCol.findOne({
      sessionId: adminSessionCookie.value,
      expiresAt: { $gt: new Date() }
    })
    if (adminSession) return { isAdmin: true, userId: 'admin_credentials' }
  }
  // Check Google session
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const usersCol = db.collection('users')
  const user = await usersCol.findOne({ email: session.user.email })
  if (!user) return null
  if (ADMIN_EMAILS.includes(session.user.email) || user.isAdmin === true) {
    return { isAdmin: true, userId: user.id }
  }
  return null
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

    // PATCH /api/orders/[id]/cancel - user cancels their own order
    if (segments[0] === 'orders' && segments[2] === 'cancel' && segments.length === 3 && method === 'PATCH') {
      const orderId = segments[1]
      const userId = await requireUserId(request)
      if (!userId) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const ordersCol = db.collection('orders')
      const order = await ordersCol.findOne({ id: orderId, userId })
      if (!order) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      const nonCancellable = ['delivered', 'cancelled', 'shipped']
      if (nonCancellable.includes(order.status?.toLowerCase())) {
        return handleCORS(NextResponse.json({ error: `Order cannot be cancelled — it is already ${order.status}` }, { status: 400 }))
      }
      await ordersCol.updateOne({ id: orderId }, { $set: { status: 'cancelled', updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, status: 'cancelled' }))
    }

    // GET /api/coupons/validate?code=XXXX
    if (segments[0] === 'coupons' && segments[1] === 'validate' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const code = searchParams.get('code')
      if (!code) return handleCORS(NextResponse.json({ error: 'Coupon code required' }, { status: 400 }))
      const col = db.collection('coupons')
      const coupon = await col.findOne({ code: code.toUpperCase().trim() })
      if (!coupon || !coupon.isActive) {
        return handleCORS(NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 }))
      }
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return handleCORS(NextResponse.json({ error: 'Coupon has expired' }, { status: 410 }))
      }
      const { _id, ...rest } = coupon
      return handleCORS(NextResponse.json(rest))
    }

    // GET /api/users (admin only)
    if (route === '/users' && method === 'GET') {
      const admin = await requireAdmin(request, db)
      if (!admin) {
        return handleCORS(
          NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
        )
      }

      // Use aggregation pipeline to fetch users with order stats in a single query
      const usersCol = db.collection('users')
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
      const limit = Math.min(Number(searchParams.get('limit') || '12'), 500)

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

    // ─── WISHLIST ENDPOINTS ───────────────────────────────────────────────────

    // GET /api/wishlist
    if (route === '/wishlist' && method === 'GET') {
      const userId = await requireUserId(request)
      if (!userId) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const col = db.collection('wishlists')
      const doc = await col.findOne({ userId })
      const items = doc?.items || []
      // Hydrate with product details
      if (items.length > 0) {
        const productsCol = db.collection('products')
        const productIds = items.map(i => i.productId)
        const products = await productsCol.find({ id: { $in: productIds } }).toArray()
        const productMap = Object.fromEntries(products.map(p => [p.id, p]))
        const hydrated = items
          .filter(i => productMap[i.productId])
          .map(i => {
            const p = productMap[i.productId]
            return { productId: p.id, slug: p.slug, title: p.title, price: p.price, image: p.images?.[0] || null, addedAt: i.addedAt }
          })
        return handleCORS(NextResponse.json(hydrated))
      }
      return handleCORS(NextResponse.json([]))
    }

    // POST /api/wishlist
    if (route === '/wishlist' && method === 'POST') {
      const userId = await requireUserId(request)
      if (!userId) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { productId } = body || {}
      if (!productId) return handleCORS(NextResponse.json({ error: 'productId required' }, { status: 400 }))
      const productsCol = db.collection('products')
      const product = await productsCol.findOne({ id: productId })
      if (!product) return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      const col = db.collection('wishlists')
      let doc = await col.findOne({ userId })
      if (!doc) {
        doc = { userId, items: [], updatedAt: new Date() }
        await col.insertOne(doc)
      }
      const exists = (doc.items || []).some(i => i.productId === productId)
      if (!exists) {
        await col.updateOne({ userId }, { $push: { items: { productId, addedAt: new Date() } }, $set: { updatedAt: new Date() } })
      }
      return handleCORS(NextResponse.json({ success: true, added: !exists }))
    }

    // DELETE /api/wishlist/[productId]
    if (segments[0] === 'wishlist' && segments.length === 2 && method === 'DELETE') {
      const productId = segments[1]
      const userId = await requireUserId(request)
      if (!userId) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const col = db.collection('wishlists')
      await col.updateOne({ userId }, { $pull: { items: { productId } }, $set: { updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // GET /api/wishlist/check/[productId] - check if product is in wishlist
    if (segments[0] === 'wishlist' && segments[1] === 'check' && segments.length === 3 && method === 'GET') {
      const productId = segments[2]
      const userId = await requireUserId(request)
      if (!userId) return handleCORS(NextResponse.json({ inWishlist: false }))
      const col = db.collection('wishlists')
      const doc = await col.findOne({ userId })
      const inWishlist = (doc?.items || []).some(i => i.productId === productId)
      return handleCORS(NextResponse.json({ inWishlist }))
    }

    // ─── ADMIN PRODUCTS CRUD ─────────────────────────────────────────────────

    // POST /api/admin/products - create product
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 2 && method === 'POST') {
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const body = await request.json()
      const { title, description, price, categorySlug, type, material, dimensions, series, images, stock, variants, subcategory } = body || {}
      if (!title || !price || !categorySlug) return handleCORS(NextResponse.json({ error: 'title, price, categorySlug required' }, { status: 400 }))
      const categoriesCol = db.collection('categories')
      const cat = await categoriesCol.findOne({ slug: categorySlug })
      const productsCol = db.collection('products')
      // Uniqueness check: block duplicate product (same title + category)
      const normalizedTitle = title.trim().toLowerCase()
      const duplicate = await productsCol.findOne({
        categorySlug,
        $expr: { $eq: [{ $toLower: { $trim: { input: '$title' } } }, normalizedTitle] }
      })
      if (duplicate) {
        return handleCORS(NextResponse.json({ error: `A product named "${title.trim()}" already exists in ${categorySlug}. Use Edit to update it.` }, { status: 409 }))
      }
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + uuidv4().slice(0, 6)
      const now = new Date()
      const product = {
        id: uuidv4(), slug, title: title.trim(),
        description: description || '',
        price: Number(price),
        categoryId: cat?.id || null,
        categorySlug,
        type: type || 'other',
        material: material || '',
        dimensions: dimensions || '',
        series: series || '',
        subcategory: subcategory || '',
        images: Array.isArray(images) ? images : (images ? [images] : []),
        stock: Number(stock) || 0,
        variants: Array.isArray(variants) ? variants : [],
        colors: Array.isArray(body.colors) ? body.colors : [],
        rating: 0, reviewCount: 0,
        popularity: 50,
        createdAt: now, updatedAt: now,
      }
      await productsCol.insertOne(product)
      const { _id, ...rest } = product
      return handleCORS(NextResponse.json(rest, { status: 201 }))
    }

    // PUT /api/admin/products/[id] - update product
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3 && method === 'PUT') {
      const productId = segments[2]
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const body = await request.json()
      const productsCol = db.collection('products')
      const existing = await productsCol.findOne({ id: productId })
      if (!existing) return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      const update = { updatedAt: new Date() }
      if (body.title != null) update.title = body.title.trim()
      if (body.description != null) update.description = body.description
      if (body.price != null) update.price = Number(body.price)
      if (body.categorySlug != null) {
        update.categorySlug = body.categorySlug
        const cat = await db.collection('categories').findOne({ slug: body.categorySlug })
        if (cat) update.categoryId = cat.id
      }
      if (body.type != null) update.type = body.type
      if (body.material != null) update.material = body.material
      if (body.dimensions != null) update.dimensions = body.dimensions
      if (body.series != null) update.series = body.series
      if (body.subcategory != null) update.subcategory = body.subcategory
      if (body.images != null) update.images = Array.isArray(body.images) ? body.images : [body.images]
      if (body.stock != null) update.stock = Number(body.stock)
      if (body.colors != null) update.colors = Array.isArray(body.colors) ? body.colors : []
      await productsCol.updateOne({ id: productId }, { $set: update })
      const updated = await productsCol.findOne({ id: productId })
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // DELETE /api/admin/products/[id] - delete product
    if (segments[0] === 'admin' && segments[1] === 'products' && segments.length === 3 && method === 'DELETE') {
      const productId = segments[2]
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const productsCol = db.collection('products')
      const existing = await productsCol.findOne({ id: productId })
      if (!existing) return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      await productsCol.deleteOne({ id: productId })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // POST /api/admin/products/deduplicate - remove duplicate products (same title+category, keep oldest)
    if (segments[0] === 'admin' && segments[1] === 'products' && segments[2] === 'deduplicate' && method === 'POST') {
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const productsCol = db.collection('products')
      // Group by title+categorySlug (case-insensitive)
      const allProducts = await productsCol.find({}).sort({ createdAt: 1 }).toArray()
      const seen = new Map()
      const toDelete = []
      for (const product of allProducts) {
        const key = `${(product.title || '').toLowerCase().trim()}||${product.categorySlug || ''}`
        if (seen.has(key)) {
          toDelete.push(product.id)
        } else {
          seen.set(key, product.id)
        }
      }
      if (toDelete.length > 0) {
        await productsCol.deleteMany({ id: { $in: toDelete } })
      }
      return handleCORS(NextResponse.json({ success: true, removed: toDelete.length, message: `Removed ${toDelete.length} duplicate product${toDelete.length !== 1 ? 's' : ''}` }))
    }

    // ─── ADMIN ORDERS ─────────────────────────────────────────────────────────

    // GET /api/admin/orders - all orders
    if (segments[0] === 'admin' && segments[1] === 'orders' && segments.length === 2 && method === 'GET') {
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get('status')
      const query = statusFilter ? { status: statusFilter } : {}
      const ordersCol = db.collection('orders')
      const docs = await ordersCol.find(query).sort({ createdAt: -1 }).limit(200).toArray()
      // Enrich with user info
      const usersCol = db.collection('users')
      const userIds = [...new Set(docs.map(o => o.userId).filter(Boolean))]
      const users = await usersCol.find({ id: { $in: userIds } }).toArray()
      const userMap = Object.fromEntries(users.map(u => [u.id, { name: u.name, email: u.email }]))
      const cleaned = docs.map(({ _id, ...o }) => ({ ...o, user: userMap[o.userId] || null }))
      return handleCORS(NextResponse.json(cleaned))
    }

    // PUT /api/admin/orders/[id] - update order status
    if (segments[0] === 'admin' && segments[1] === 'orders' && segments.length === 3 && method === 'PUT') {
      const orderId = segments[2]
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const body = await request.json()
      const { status } = body || {}
      const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
      if (!status || !validStatuses.includes(status)) {
        return handleCORS(NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 }))
      }
      const ordersCol = db.collection('orders')
      const existing = await ordersCol.findOne({ id: orderId })
      if (!existing) return handleCORS(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
      await ordersCol.updateOne({ id: orderId }, { $set: { status, updatedAt: new Date() } })
      const updated = await ordersCol.findOne({ id: orderId })
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // ─── COUPON CRUD ─────────────────────────────────────────────────────────

    // GET /api/coupons - list all coupons (admin)
    if (route === '/coupons' && method === 'GET') {
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const col = db.collection('coupons')
      const docs = await col.find({}).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, ...rest }) => rest)))
    }

    // POST /api/coupons - create coupon (admin)
    if (route === '/coupons' && method === 'POST') {
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const body = await request.json()
      const { code, type, value, minOrder, expiryDate, description } = body || {}
      if (!code || !type || value == null) return handleCORS(NextResponse.json({ error: 'code, type, value required' }, { status: 400 }))
      if (!['percentage', 'flat'].includes(type)) return handleCORS(NextResponse.json({ error: 'type must be percentage or flat' }, { status: 400 }))
      const col = db.collection('coupons')
      const existing = await col.findOne({ code: code.toUpperCase().trim() })
      if (existing) return handleCORS(NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 }))
      const coupon = {
        id: uuidv4(),
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        description: description || '',
        isActive: true,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageCount: 0,
        createdAt: new Date(),
      }
      await col.insertOne(coupon)
      const { _id, ...rest } = coupon
      return handleCORS(NextResponse.json(rest, { status: 201 }))
    }

    // PUT /api/coupons/[id] - update/toggle coupon (admin)
    if (segments[0] === 'coupons' && segments.length === 2 && method === 'PUT') {
      const couponId = segments[1]
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const body = await request.json()
      const col = db.collection('coupons')
      const update = { updatedAt: new Date() }
      if (body.isActive != null) update.isActive = Boolean(body.isActive)
      if (body.value != null) update.value = Number(body.value)
      if (body.minOrder != null) update.minOrder = Number(body.minOrder)
      if (body.description != null) update.description = body.description
      if (body.expiryDate != null) update.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
      await col.updateOne({ id: couponId }, { $set: update })
      const updated = await col.findOne({ id: couponId })
      if (!updated) return handleCORS(NextResponse.json({ error: 'Coupon not found' }, { status: 404 }))
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // DELETE /api/coupons/[id] - delete coupon (admin)
    if (segments[0] === 'coupons' && segments.length === 2 && method === 'DELETE') {
      const couponId = segments[1]
      const admin = await requireAdmin(request, db)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Admin access required' }, { status: 403 }))
      const col = db.collection('coupons')
      await col.deleteOne({ id: couponId })
      return handleCORS(NextResponse.json({ success: true }))
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
