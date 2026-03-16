'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { avatarIdToSrc } from '../lib/avatars';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  parentId?: string | null;
  userId?: string | null;
  avatarId?: string | null;
}

export default function NewsComments({ slug }: { slug: string }) {
  const t = useTranslations('comments');
  const locale = useLocale();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatarId, setUserAvatarId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Получить данные текущего пользователя (id + аватарId)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id || null);
          setUserAvatarId(data.currentAvatar || data.avatarId || null);
        }
      } catch {
        setUserId(null);
        setUserAvatarId(null);
      }
    };
    fetchUser();
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const res = await fetch(`/api/news/${slug}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || data || []);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [slug]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    if (isAuthenticated === false) {
      const returnTo = `/${locale}/news/${slug}`;
      router.push(`/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText('');
      } else if (res.status === 401) {
        router.push(`/${locale}/auth/login`);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, isAuthenticated, comments, slug, locale, router]);

  // Ответ на комментарий
  const handleReply = useCallback(async (parentId: string) => {
    if (!commentText.trim()) return;

    if (isAuthenticated === false) {
      const returnTo = `/${locale}/news/${slug}`;
      router.push(`/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, parentId }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentText('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, slug, comments, isAuthenticated, locale, router]);

  // Редактирование комментария
  const handleEdit = useCallback(async (commentId: string) => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${slug}/comments/actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments(comments.map(c => c.id === commentId ? { ...c, content: updated.content } : c));
        setEditId(null);
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [editText, slug, comments]);

  // Удаление комментария
  const handleDelete = useCallback(async (commentId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/news/${slug}/comments/actions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [slug, comments]);

  if (isLoading) {
    return <div className="text-center py-6 text-[#9CA3AF]">{t('loading')}</div>;
  }

  return (
    <section className="mt-12 pt-8 border-t border-[#E5E7EB]">
      <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold text-[#1C1C1C] mb-8">{t('title')}</h2>

      {/* Comment form */}
      <div className="mb-10">
        {isAuthenticated === null ? (
          <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />
        ) : isAuthenticated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-[#1C1C1C] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#9C0000] min-h-[120px] resize-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="bg-[#9C0000] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#7D0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center">
            <p className="text-[#1C1C1C] mb-4">{t('loginRequired')}</p>
            <button
              onClick={() => {
                const returnTo = `/${locale}/news/${slug}`;
                router.push(`/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
              }}
              className="bg-[#9C0000] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#7D0000] transition-colors"
            >
              {t('login')}
            </button>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-[#9CA3AF] py-8">{t('noComments')}</p>
        ) : (
          comments.map((comment) => {
            const date = new Date(comment.date);
            const formattedDate = date.toLocaleDateString('uk-UA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const isOwner = userId && comment.userId && userId === comment.userId;
            const avatarSrc =
              avatarIdToSrc(comment.avatarId) ||
              (isOwner ? avatarIdToSrc(userAvatarId) : null);

            return (
              <div key={comment.id} className="border-l-4 border-[#9C0000] pl-6 py-4">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xs font-semibold text-[#9C0000] overflow-hidden">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt={comment.author} className="w-full h-full object-cover" />
                      ) : (
                        comment.author.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="font-semibold text-[#1C1C1C]">{comment.author}</p>
                  </div>
                  <p className="text-sm text-[#9CA3AF] mt-1">{formattedDate}</p>
                </div>
                {editId === comment.id ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleEdit(comment.id);
                    }}
                    className="space-y-2 mb-2"
                  >
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2 text-[#1C1C1C]"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-[#9C0000] text-white px-4 py-1 rounded" disabled={isSubmitting}>{t('save')}</button>
                      <button type="button" className="bg-gray-200 px-4 py-1 rounded" onClick={() => setEditId(null)}>{t('cancel')}</button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                )}
                <div className="flex gap-3 mt-2">
                  {!isOwner && (
                    <button
                      className="text-xs text-[#9C0000] underline hover:no-underline"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      {t('reply')}
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button
                        className="text-xs text-[#1C1C1C] underline hover:no-underline"
                        onClick={() => {
                          setEditId(comment.id);
                          setEditText(comment.content);
                        }}
                      >{t('edit')}</button>
                      <button
                        className="text-xs text-[#9C0000] underline hover:no-underline"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isSubmitting}
                      >{t('delete')}</button>
                    </>
                  )}
                </div>
                {replyTo === comment.id && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleReply(comment.id);
                    }}
                    className="space-y-2 mt-2"
                  >
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E7EB] px-4 py-2 text-[#1C1C1C]"
                      placeholder={t('replyPlaceholder')}
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-[#9C0000] text-white px-4 py-1 rounded" disabled={isSubmitting}>{t('send')}</button>
                      <button type="button" className="bg-gray-200 px-4 py-1 rounded" onClick={() => setReplyTo(null)}>{t('cancel')}</button>
                    </div>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
