/**
 * Preservation Property Tests
 *
 * These tests verify non-buggy behavior that MUST remain unchanged after fixes.
 * They are written BEFORE any fix is applied and MUST PASS on unfixed code.
 *
 * Passing confirms the baseline behavior we need to preserve.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ─── Mock useAuth ─────────────────────────────────────────────────────────────
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn(),
}));

// ─── Mock API services ────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  postsAPI: {
    getFeed: vi.fn(),
    getAllPosts: vi.fn(),
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    getPost: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
  },
  usersAPI: {
    getMyProfile: vi.fn(),
  },
  authAPI: {
    signIn: vi.fn(),
    signUp: vi.fn(),
  },
  default: { interceptors: { request: { use: vi.fn() } } },
}));

import { useContext } from 'react';
import { useAuth } from '../contexts/useAuth';
import { postsAPI } from '../services/api';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthContext } from '../contexts/AuthContextValue';
import SignIn from '../pages/SignIn';
import Home from '../pages/Home';
import CreatePost from '../pages/CreatePost';

// ─────────────────────────────────────────────────────────────────────────────
// Test P1 — Auth context values accessible to child components
//
// Preservation: Authenticated users receive user, signIn, signOut,
//               isAuthenticated from auth context without interruption.
// Must PASS on unfixed code.
// ─────────────────────────────────────────────────────────────────────────────
describe('P1 — Auth context values accessible (Req 3.1)', () => {
  /**
   * Validates: Requirements 3.1
   *
   * Render a child component inside AuthProvider and assert it receives
   * user, signIn, signOut, isAuthenticated from the context.
   *
   * This uses the REAL AuthProvider (not the mocked useAuth) to verify
   * the context values are actually provided by the provider.
   */
  it('should provide user, signIn, signOut, isAuthenticated to child components', async () => {
    // Capture the context values received by a child component
    let capturedContext = null;

    // Read context directly from AuthContext (bypasses the mocked useAuth)
    const ContextReader = () => {
      capturedContext = useContext(AuthContext);
      return <div data-testid="child">child</div>;
    };

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ContextReader />
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(capturedContext).not.toBeNull();
    expect(capturedContext).toHaveProperty('user');
    expect(capturedContext).toHaveProperty('signIn');
    expect(capturedContext).toHaveProperty('signOut');
    expect(capturedContext).toHaveProperty('isAuthenticated');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test P2 — Valid sign-in navigates to /
//
// Preservation: Valid credential submission on Sign In navigates to home page.
// Must PASS on unfixed code.
//
// On unfixed code: handleSubmit wraps signIn() in try/catch. When signIn()
// returns { success: true } (no throw), the try block completes and
// navigate('/') IS called. So this test passes on unfixed code.
// ─────────────────────────────────────────────────────────────────────────────
describe('P2 — Valid sign-in navigates to / (Req 3.2)', () => {
  /**
   * Validates: Requirements 3.2
   *
   * Mock signIn() to return { success: true }.
   * Submit the SignIn form with valid-looking credentials.
   * Assert navigation to / occurred.
   *
   * On unfixed code: try { await signIn(formData); navigate('/'); } — since
   * signIn() resolves without throwing, navigate('/') IS called.
   */
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn(),
    });
  });

  it('should navigate to / when signIn returns { success: true }', async () => {
    const HomeStub = () => <div data-testid="home-page">Home</div>;

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<HomeStub />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'correctpassword' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test P3 — Like/unlike updates count correctly
//
// Preservation: Optimistic like/unlike updates the count and heart icon
//               correctly (even with 'currentUser' placeholder on unfixed code).
// Must PASS on unfixed code.
//
// On unfixed code: handleLike pushes 'currentUser' into post.likes, so the
// count increments from 0 to 1. The count update works correctly.
// ─────────────────────────────────────────────────────────────────────────────
describe('P3 — Like/unlike updates count correctly (Req 3.3)', () => {
  /**
   * Validates: Requirements 3.3
   *
   * Render Home with a post that has 0 likes.
   * Mock useAuth with a user.
   * Click the like button.
   * Assert the like count increments to 1.
   *
   * On unfixed code: handleLike adds 'currentUser' to likes array,
   * so post.likes.length goes from 0 to 1 — count shows 1.
   */
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { _id: 'user-001', username: 'testuser' },
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    postsAPI.likePost.mockResolvedValue({ data: {} });
    postsAPI.unlikePost.mockResolvedValue({ data: {} });
  });

  it('should increment like count from 0 to 1 when like button is clicked', async () => {
    postsAPI.getFeed.mockResolvedValue({
      data: [{
        _id: 'post-001',
        title: 'Test Post',
        content: 'Some content here',
        likes: [], // 0 likes initially
        author: { _id: 'author-001', username: 'author' },
        createdAt: new Date().toISOString(),
      }],
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Wait for the post to load
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });

    // Verify initial count is 0
    const likeButton = screen.getByRole('button', { name: /❤️/i });
    expect(likeButton).toHaveTextContent('0');

    // Click the like button
    await act(async () => {
      fireEvent.click(likeButton);
    });

    // Assert count incremented to 1
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /❤️/i })).toHaveTextContent('1');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test P4 — CreatePost without ?edit= renders blank form and calls createPost
//
// Preservation: Navigating to /create-post without ?edit= renders a blank
//               new-post form and calls postsAPI.createPost on submit.
// Must PASS on unfixed code.
// ─────────────────────────────────────────────────────────────────────────────
describe('P4 — CreatePost without ?edit= renders blank form and calls createPost (Req 3.4)', () => {
  /**
   * Validates: Requirements 3.4
   *
   * Render CreatePost at /create-post (no edit param).
   * Assert title and content inputs are empty.
   * Fill in the form and submit.
   * Assert postsAPI.createPost was called (not updatePost).
   *
   * On unfixed code: CreatePost ignores ?edit= entirely, always renders
   * blank form and always calls createPost — so this passes.
   */
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { _id: 'user-001', username: 'testuser' },
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    postsAPI.createPost.mockResolvedValue({
      data: { _id: 'new-post-001' },
    });
  });

  it('should render blank form and call createPost on submit when no ?edit= param', async () => {
    render(
      <MemoryRouter initialEntries={['/create-post']}>
        <Routes>
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/posts/:id" element={<div data-testid="post-detail">Post Detail</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Assert title and content inputs are empty (blank form)
    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    expect(titleInput).toHaveValue('');
    expect(contentInput).toHaveValue('');

    // Fill in the form
    fireEvent.change(titleInput, { target: { value: 'My New Post' } });
    fireEvent.change(contentInput, { target: { value: 'Post content here' } });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create post/i }));
    });

    // Assert createPost was called (not updatePost)
    await waitFor(() => {
      expect(postsAPI.createPost).toHaveBeenCalledWith({
        title: 'My New Post',
        content: 'Post content here',
      });
    });
    expect(postsAPI.updatePost).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test P5 — Authenticated user accesses /create-post without redirect
//
// Preservation: Authenticated users can access /create-post without redirect.
// Must PASS on unfixed code.
//
// On unfixed code: No ProtectedRoute exists, so ALL users (authenticated or
// not) always see the page. Authenticated users definitely see it.
// ─────────────────────────────────────────────────────────────────────────────
describe('P5 — Authenticated user accesses /create-post without redirect (Req 3.5)', () => {
  /**
   * Validates: Requirements 3.5
   *
   * Render the route with isAuthenticated: true.
   * Navigate to /create-post.
   * Assert CreatePost renders (no redirect to /signin).
   *
   * On unfixed code: no ProtectedRoute exists, so the page always renders
   * regardless of auth state — authenticated users always see it.
   */
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { _id: 'user-001', username: 'testuser' },
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('should render CreatePost for authenticated user without redirecting to /signin', async () => {
    render(
      <MemoryRouter initialEntries={['/create-post']}>
        <Routes>
          <Route path="/signin" element={<div data-testid="signin-page">Sign In</div>} />
          <Route path="/create-post" element={<CreatePost />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert CreatePost renders (heading is visible)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create new post/i })).toBeInTheDocument();
    });

    // Assert we are NOT on the signin page
    expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
  });
});
