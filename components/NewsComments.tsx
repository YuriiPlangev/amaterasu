'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
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

            return (
              <div key={comment.id} className="border-l-4 border-[#9C0000] pl-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#1C1C1C]">{comment.author}</p>
                  <p className="text-sm text-[#9CA3AF]">{formattedDate}</p>
                </div>
                <p className="text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
