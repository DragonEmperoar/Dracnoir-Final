'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/AppShell'
import { ThumbsUp, MessageCircle, Trash2, Send, ArrowLeft, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

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
  const sz = size === 'lg' ? 'h-12 w-12 text-base' : 'h-8 w-8 text-xs'
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover border border-border flex-shrink-0`} />
  return (
    <div className={`${sz} rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-semibold text-violet-400 flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

export default function PostPage({ params }) {
  const { id } = params
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [upvoting, setUpvoting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)
  const commentInputRef = useRef(null)

  // Fetch post + comments
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/community/posts/${id}`),
          fetch(`/api/community/posts/${id}/comments`),
        ])
        if (!postRes.ok) { router.push('/community'); return }
        const postData = await postRes.json()
        const commentsData = await commentsRes.json()
        setPost(postData)
        setComments(Array.isArray(commentsData) ? commentsData : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleUpvote = async () => {
    if (!session) { router.push('/login'); return }
    if (upvoting) return
    setUpvoting(true)
    try {
      const res = await fetch(`/api/community/posts/${id}/upvote`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setPost(p => ({ ...p, upvoteCount: data.upvoteCount, userUpvoted: data.userUpvoted }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpvoting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/community/posts/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/community')
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!session) { router.push('/login'); return }
    if (!commentText.trim()) return
    setCommentError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      })
      const data = await res.json()
      if (!res.ok) { setCommentError(data.error || 'Failed to post comment'); return }
      setComments(prev => [...prev, data])
      setCommentText('')
      setPost(p => ({ ...p, commentCount: (p.commentCount || 0) + 1 }))
    } catch {
      setCommentError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/community/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        setPost(p => ({ ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-6 w-3/4 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded bg-muted" />)}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!post) return null

  const isOwner = session?.user?.id === post.userId

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push('/community')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </button>

        {/* ── Post Card ── */}
        <article className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Optional image */}
          {post.image && (
            <div className="max-h-80 overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Author + meta */}
            <div className="flex items-start gap-3">
              <Avatar name={post.userName} image={post.userImage} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{post.userName}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                  {post.category && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_STYLES[post.category] || 'bg-muted text-muted-foreground border-border'}`}>
                      {post.category}
                    </span>
                  )}
                </div>
              </div>
              {/* Delete button (own posts) */}
              {isOwner && (
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="flex-shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors"
                  title="Delete post"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground leading-tight">{post.title}</h1>

            {/* Content */}
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Upvote + comment count */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  post.userUpvoted
                    ? 'border-violet-500/60 bg-violet-500/10 text-violet-400'
                    : 'border-border bg-card text-muted-foreground hover:border-violet-500/40 hover:text-violet-400'
                }`}
              >
                {upvoting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ThumbsUp className="h-4 w-4" />
                }
                <span>{post.upvoteCount || 0}</span>
                <span className="hidden sm:inline text-xs">{post.userUpvoted ? 'Upvoted' : 'Upvote'}</span>
              </button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </article>

        {/* ── Comments Section ── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Comments{comments.length > 0 ? ` (${comments.length})` : ''}
          </h2>

          {/* Comment form */}
          {session ? (
            <form onSubmit={handleAddComment} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex gap-3">
                <Avatar name={session.user.name} image={session.user.image} />
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  maxLength={1000}
                  rows={3}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none resize-none"
                />
              </div>
              {commentError && (
                <p className="text-xs text-red-400 pl-11">{commentError}</p>
              )}
              <div className="flex items-center justify-between pl-11">
                <span className="text-[10px] text-muted-foreground">{commentText.length}/1000</span>
                <Button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  size="sm"
                  className="rounded-full bg-violet-500 hover:bg-violet-400 gap-1.5 text-xs"
                >
                  {submitting
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Posting...</>
                    : <><Send className="h-3 w-3" /> Post</>}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">Login to join the conversation</p>
              <Button
                onClick={() => router.push('/login')}
                className="rounded-full bg-violet-500 hover:bg-violet-400 text-sm"
              >
                Login to Comment
              </Button>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to reply!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-border bg-card p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={comment.userName} image={comment.userImage} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{comment.userName}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                    {/* Delete own comment */}
                    {session?.user?.id === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-red-400 transition-all"
                        title="Delete comment"
                      >
                        {deletingCommentId === comment.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <X className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
