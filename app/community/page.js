'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '../AppShell'
import { Plus, Flame, Clock, ChevronRight, ThumbsUp, MessageCircle, X, ImageIcon, Loader2, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'

const CATEGORIES = [
  { id: 'all', label: 'All Posts', emoji: '📋' },
  { id: 'Merch Reviews', label: 'Merch Reviews', emoji: '🛍️' },
  { id: 'Collection Showcase', label: 'Collection Showcase', emoji: '🗂️' },
  { id: 'Anime Hype', label: 'Anime Hype', emoji: '🔥' },
  { id: 'Dracnoir Drops', label: 'Dracnoir Drops', emoji: '⚡' },
  { id: 'Recommendations', label: 'Recommendations', emoji: '💬' },
]

const CATEGORY_STYLES = {
  'Merch Reviews':        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Collection Showcase':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Anime Hype':           'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Dracnoir Drops':       'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Recommendations':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

function timeAgo(date) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) }
  catch { return '' }
}

function Avatar({ name, image, size = 'sm' }) {
  const sz = size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover border border-border flex-shrink-0`} />
  return (
    <div className={`${sz} rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-semibold text-violet-400 flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

function PostCard({ post, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:border-violet-500/50 transition-all duration-200 group overflow-hidden"
    >
      {post.image && (
        <div className="h-44 overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={post.userName} image={post.userImage} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-medium text-foreground/80">{post.userName}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
              {post.category && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[post.category] || 'bg-muted text-muted-foreground border-border'}`}>
                  {post.category}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.content && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {post.content}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span className={`flex items-center gap-1.5 ${post.userUpvoted ? 'text-violet-400' : ''}`}>
            <ThumbsUp className="h-3.5 w-3.5" />
            {post.upvoteCount || 0}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount || 0}
          </span>
          <span className="ml-auto flex items-center gap-0.5 text-violet-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
            Read more <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  )
}

function CreatePostModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'Merch Reviews', image: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create post'); return }
      onCreated(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Create Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title <span className="text-red-400">*</span></Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What do you want to share?"
              maxLength={200}
              className="border-border bg-card text-foreground text-sm"
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.title.length}/200</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category <span className="text-red-400">*</span></Label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-violet-500 focus:outline-none"
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Content <span className="text-red-400">*</span></Label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Share your thoughts, reviews, or showcase your collection..."
              maxLength={5000}
              rows={5}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.content.length}/5000</p>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL <span className="text-muted-foreground/50">(optional)</span></Label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://i.imgur.com/example.jpg"
                className="border-border bg-card text-foreground text-sm pl-9"
              />
            </div>
            {form.image && (
              <img src={form.image} alt="preview" className="mt-2 h-24 w-full rounded-lg object-cover border border-border" onError={e => e.target.style.display='none'} />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-violet-500 hover:bg-violet-400 text-sm font-semibold"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting...</> : 'Post to Community'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full border-border text-foreground/80"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [fetching, setFetching] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSort, setActiveSort] = useState('latest')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        setFetching(true)
        const params = new URLSearchParams({ sort: activeSort, limit: '30' })
        if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory)
        const res = await fetch(`/api/community/posts?${params}`)
        const data = await res.json()
        setPosts(data.posts || [])
        setTotal(data.total || 0)
      } catch (err) {
        console.error('Community fetch error:', err)
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [activeCategory, activeSort])

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
    setTotal(t => t + 1)
    setShowCreateModal(false)
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Dracnoir</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Community</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discuss merch, showcase your collection, and hype up anime drops.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-violet-500" />
              <span>{total} posts</span>
            </div>
            {session ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-violet-500 hover:bg-violet-400 text-sm gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Post
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="rounded-full border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-sm"
              >
                Login to post
              </Button>
            )}
          </div>
        </div>

        {/* ── Filters Row ── */}
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'border border-border bg-card text-muted-foreground hover:border-violet-500/40 hover:text-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSort('latest')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSort === 'latest'
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Latest
            </button>
            <button
              onClick={() => setActiveSort('trending')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSort === 'trending'
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Trending
            </button>
          </div>
        </div>

        {/* ── Post Grid ── */}
        {fetching ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (posts || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
              <MessageCircle className="h-8 w-8 text-violet-500/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No posts yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {activeCategory !== 'all'
                ? `No posts in ${activeCategory} yet. Be the first!`
                : 'The community is quiet. Start the conversation!'}
            </p>
            {session ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 rounded-full bg-violet-500 hover:bg-violet-400 gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create First Post
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="mt-4 rounded-full border-violet-500/40 text-violet-400"
              >
                Login to post
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(posts || []).map(post => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => router.push(`/community/post/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </AppShell>
  )
}
