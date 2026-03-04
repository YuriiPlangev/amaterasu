import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { cookies } from 'next/headers';
import axios from 'axios';

/**
 * GET /api/news/[slug]/comments
 * Get all comments for a news post from WordPress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    let { slug } = await params;
    // Декодируем slug если он URL-encoded
    slug = decodeURIComponent(slug);
    
    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

    if (!wpUrl) {
      return NextResponse.json(
        { error: 'WP_URL не налаштований' },
        { status: 500 }
      );
    }

    // Fetch post to get its ID
    const postResponse = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
      params: { slug, _embed: false },
    });

    if (!postResponse.data || postResponse.data.length === 0) {
      return NextResponse.json({ comments: [], nonce: null });
    }

    const postId = postResponse.data[0].id;

    // Fetch comments for this post
    const commentsResponse = await axios.get(`${wpUrl}/wp-json/wp/v2/comments`, {
      params: {
        post: postId,
        per_page: 100,
        orderby: 'date',
        order: 'desc',
      },
    });

    const comments = (commentsResponse.data || []).map((comment: any) => ({
      id: comment.id.toString(),
      author: comment.author_name,
      content: comment.content.rendered,
      date: comment.date,
    }));

    // Get nonce for creating comments
    let nonce = null;
    try {
      const nonceResponse = await axios.get(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
        params: { _wpnonce: 'nonce' },
      });
      nonce = nonceResponse.headers['x-wp-nonce'] || null;
    } catch (e) {
      // Nonce not available, that's OK
    }

    return NextResponse.json({ comments, nonce });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ comments: [], nonce: null });
  }
}

/**
 * POST /api/news/[slug]/comments
 * Add a new comment (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    let { slug } = await params;
    // Декодируем slug если он URL-encoded
    slug = decodeURIComponent(slug);
    
    console.log('POST /api/news/[slug]/comments - received slug:', slug);
    
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const wpUrl = process.env.WP_URL || process.env.NEXT_PUBLIC_WP_URL;

    if (!wpUrl) {
      return NextResponse.json(
        { error: 'WP_URL не налаштований' },
        { status: 500 }
      );
    }

    // Fetch post to get its ID
    const postResponse = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
      params: { slug, _embed: false },
    });

    if (!postResponse.data || postResponse.data.length === 0) {
      console.log('Post not found for slug:', slug);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const postId = postResponse.data[0].id;
    console.log('Found post ID:', postId);

    // Create comment in WordPress
    const commentData = {
      post: postId,
      author_name: decoded.login || 'Anonymous',
      author_email: decoded.email || 'noreply@example.com',
      content: content.trim(),
    };

    console.log('Creating comment with data:', commentData);

    // Create comment without authentication
    // WordPress REST API allows anonymous comment creation by default
    try {
      const commentResponse = await axios.post(
        `${wpUrl}/wp-json/wp/v2/comments`,
        commentData,
        {
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        }
      );

      if (commentResponse.status === 401 || commentResponse.status === 403) {
        // If anonymous comments are not allowed, try with authentication
        const wpUsername = process.env.WP_USER;
        const wpPassword = process.env.WP_PASSWORD;

        if (wpUsername && wpPassword) {
          const auth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');
          const axiosInstance = axios.create({
            baseURL: wpUrl,
            headers: {
              'Authorization': `Basic ${auth}`,
            },
          });

          const authCommentResponse = await axiosInstance.post(
            '/wp-json/wp/v2/comments',
            commentData
          );

          return NextResponse.json(
            {
              id: authCommentResponse.data.id.toString(),
              author: authCommentResponse.data.author_name,
              content: authCommentResponse.data.content.rendered,
              date: authCommentResponse.data.date,
            },
            { status: 201 }
          );
        } else {
          throw new Error('Anonymous comments not allowed and no credentials provided');
        }
      }

      return NextResponse.json(
        {
          id: commentResponse.data.id.toString(),
          author: commentResponse.data.author_name,
          content: commentResponse.data.content.rendered,
          date: commentResponse.data.date,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in POST /api/news/[slug]/comments:', error);
    const errorDetails = error instanceof axios.AxiosError 
      ? {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        }
      : error;
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: 'Failed to create comment', details: errorDetails },
      { status: 500 }
    );
  }
}
