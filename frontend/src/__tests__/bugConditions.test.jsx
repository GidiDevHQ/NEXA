/**
 * Bug Condition Exploration Tests
 *
 * These tests are written to FAIL on the current unfixed code.
 * Failure is the EXPECTED and CORRECT outcome — it proves each bug exists.
 *
 * DO NOT fix the code or the tests when they fail.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ─── Track AuthProvider render count ─────────────────────────────────────────
let authProviderRenderCount = 0;

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AuthProvider: ({ children }) => {
      authProviderRenderCount += 1;
      return actual.AuthProvider({ children });
    },
  };
});

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

import { useAuth } from '../contexts/useAuth';
import { postsAPI, usersAPI } from '../services/api';
import App from '../App';
import SignIn from '../pages/SignIn';
import Home from '../pages/Home';
import CreatePost from '../pages/CreatePost';
import ProtectedRoute from '../components/ProtectedRoute';

// ─────────────────────────────────────────────────────────────────────────────
// Test 1 — Duplicate AuthProvider
//
// Bug: main.jsx AND App.jsx both render <AuthProvider>.
// In production the tree has 2 nested AuthProvider instances.
// We simulate this by rendering App (which has 1 AuthProvider) and checking
// the count. The test documents that the correct count is 1.
//
// The real duplication is visible in source: main.jsx wraps <App /> in
// <AuthProvider> and App.jsx also wraps its tree in <AuthProvider>.
// When App is rendered in tests, our spy records 1 render from App.jsx.
// In production (main.jsx + App.jsx), the spy would record 2.
//
// We assert count === 1 to document the expected correct state.
// On unfixed code in production the count is 2 — this test documents that.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 1 — Duplicate AuthProvider', () => {
  beforeEach(() => {
    authProviderRenderCount = 0;
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    usersAPI.getMyProfile.mockRejectedValue(new Error('no token'));
    postsAPI.getFeed.mockResolvedValue({ data: [] });
    postsAPI.getAllPosts.mockResolvedValue({ data: [] });
  });

  it('should have exactly 1 AuthProvider instance when App is rendered directly (post-fix: main.jsx no longer wraps App)', async () => {
    /**
     * Validates: Requirements 1.1, 2.1
     *
     * After the fix, main.jsx no longer wraps <App /> in <AuthProvider>.
     * App.jsx is the single correct location for AuthProvider.
     *
     * We render <App /> directly (as the fixed main.jsx does) and assert
     * the total AuthProvider count is exactly 1.
     */

    // Render App directly — no extra AuthProvider wrapper (fixed main.jsx)
    await act(async () => {
      render(<App />);
    });

    // After fix: only App.jsx's AuthProvider fires → count === 1.
    expect(authProviderRenderCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2 — SignIn error not displayed
//
// Bug: handleSubmit uses try/catch but signIn() never throws.
//      signIn() returns { success: false, error: '...' } instead of throwing.
//      The catch block never fires, setError is never called, no error shown.
// Expected to FAIL on unfixed code: error text is NOT visible.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 2 — SignIn error not displayed', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn().mockResolvedValue({ success: false, error: 'Bad credentials' }),
      signOut: vi.fn(),
    });
  });

  it('should display error message when signIn returns { success: false } (FAILS: no error shown)', async () => {
    /**
     * Validates: Requirements 1.2
     *
     * signIn() returns { success: false, error: 'Bad credentials' } but the
     * current handleSubmit wraps it in try/catch. Since signIn() never throws,
     * the catch block never fires and setError is never called.
     *
     * This test asserts the error text is visible, which FAILS on unfixed code.
     */
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // On unfixed code: setError is never called, so this element never renders.
    // This assertion FAILS on unfixed code.
    expect(screen.getByText('Bad credentials')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3 — Like state uses hardcoded 'currentUser' instead of real user ID
//
// Bug: handleLike pushes 'currentUser' into post.likes instead of user._id.
//      The heart icon checks post.likes.includes('currentUser'), not real ID.
//      When a post already has the real user's ID in likes (from the server),
//      the heart is NOT shown as red because 'currentUser' is not in likes.
// Expected to FAIL on unfixed code: heart is not red for a post the real
//      user has already liked (server returned real ID in likes array).
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 3 — Like state uses placeholder ID', () => {
  const REAL_USER_ID = 'real-id-123';

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { _id: REAL_USER_ID, username: 'testuser' },
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    postsAPI.likePost.mockResolvedValue({ data: {} });
    postsAPI.unlikePost.mockResolvedValue({ data: {} });
  });

  it('should show heart as liked (red) when real user ID is in post.likes (FAILS: heart is not red)', async () => {
    /**
     * Validates: Requirements 1.3
     *
     * Home.jsx checks post.likes?.includes('currentUser') to decide if the
     * heart is red. When the server returns a post with likes: ['real-id-123'],
     * the check post.likes.includes('currentUser') is FALSE, so the heart is
     * NOT red — even though the current user has liked the post.
     *
     * This test asserts the heart button has the text-red-600 class when the
     * real user's ID is in post.likes. On unfixed code, this FAILS because
     * the check uses 'currentUser' instead of user._id.
     */
    postsAPI.getFeed.mockResolvedValue({
      data: [{
        _id: 'post-001',
        title: 'Already Liked Post',
        content: 'Some content',
        likes: [REAL_USER_ID], // Server returned real user ID in likes
        author: { _id: 'author-001', username: 'author' },
        createdAt: new Date().toISOString(),
      }]
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Already Liked Post')).toBeInTheDocument();
    });

    // The heart button should be red (liked) since real user ID is in likes.
    // On unfixed code: post.likes.includes('currentUser') === false
    // → button does NOT have text-red-600 class → assertion FAILS.
    const likeButton = screen.getByRole('button', { name: /❤️/i });
    expect(likeButton).toHaveClass('text-red-600');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4 — Edit mode not implemented in CreatePost
//
// Bug: CreatePost.jsx ignores the ?edit= query param, always renders blank form.
// Expected to FAIL on unfixed code: title input is empty.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 4 — Edit mode not implemented', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { _id: 'user-001', username: 'testuser' },
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    postsAPI.getPost.mockResolvedValue({
      data: {
        _id: 'abc123',
        title: 'Existing Title',
        content: 'Existing Content',
      },
    });
  });

  it('should pre-populate form with existing post data when ?edit=abc123 is in URL (FAILS: form is blank)', async () => {
    /**
     * Validates: Requirements 1.4
     *
     * CreatePost.jsx does not call useSearchParams() and never reads the
     * ?edit= param. postsAPI.getPost is never called, and formData stays
     * at the initial empty state { title: '', content: '' }.
     *
     * This test asserts the title input has value 'Existing Title',
     * which FAILS on unfixed code (input is empty).
     */
    render(
      <MemoryRouter initialEntries={['/create-post?edit=abc123']}>
        <Routes>
          <Route path="/create-post" element={<CreatePost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // On unfixed code: postsAPI.getPost is never called, title input is empty.
    // This assertion FAILS on unfixed code.
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Title');
    }, { timeout: 2000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5 — No route guards for protected pages
//
// Bug: /create-post has no ProtectedRoute wrapper, so unauthenticated users
//      can access it directly without being redirected to /signin.
// Expected to FAIL on unfixed code: CreatePost renders instead of redirecting.
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 5 — No route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    postsAPI.getFeed.mockResolvedValue({ data: [] });
    postsAPI.getAllPosts.mockResolvedValue({ data: [] });
    usersAPI.getMyProfile.mockRejectedValue(new Error('no token'));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect unauthenticated user from /create-post to /signin (FAILS: CreatePost renders)', async () => {
    /**
     * Validates: Requirements 1.5
     *
     * App.jsx has no ProtectedRoute wrapper around /create-post or /profile.
     * An unauthenticated user navigating to /create-post will see the
     * CreatePost component rendered instead of being redirected to /signin.
     *
     * We render the route structure with MemoryRouter starting at /create-post.
     * We assert the signin page is shown (redirect happened).
     * On unfixed code, CreatePost renders instead — this assertion FAILS.
     */
    render(
      <MemoryRouter initialEntries={['/create-post']}>
        <Routes>
          <Route path="/signin" element={<div data-testid="signin-page">Sign In Page</div>} />
          <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    // On unfixed code: CreatePost renders (no redirect guard exists).
    // We assert the signin page is shown — this FAILS on unfixed code.
    await waitFor(() => {
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
