# NEXA

NEXA is a full-stack social platform built with a React + Vite frontend and an Express + MongoDB backend. It supports user authentication, post creation, likes, follows, comments, and nested replies.

## Project structure

- `backend/` - Express server, MongoDB models, auth, post management, user profile actions, comments, and replies.
  - `Configs/` - database connection config
  - `Controllers/` - request handlers for auth, posts, users, comments
  - `Middlewares/` - auth and error middleware
  - `Models/` - Mongoose schemas for User, Post, Comment
  - `Routes/` - route definitions for auth, posts, users, comments
- `frontend/` - React application with Vite, Axios API service, auth state, page views, and styling.
  - `src/pages/` - main screens like Home, Profile, PostDetail, SignIn/SignUp
  - `src/components/` - reusable UI elements and shared components
  - `src/contexts/` - auth state and user session context
  - `src/services/` - API client and endpoint handlers

## Package scripts

### Backend
- `npm run dev` - start backend with nodemon
- `npm start` - start backend with Node
- `npm test` - run Jest tests

### Frontend
- `npm run dev` - start Vite development server
- `npm run build` - build production app
- `npm run preview` - preview production build
- `npm test` - run Vitest tests

## Key features

- User sign up and sign in
- Create, edit, delete, publish, and unpublish posts
- Like and unlike posts
- Follow and unfollow users
- View a feed and individual posts
- Comment on posts
- Reply to comments
- Like and unlike comments

## Tech stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, dotenv
- Frontend: React, Vite, Axios, Tailwind CSS, React Router
- Testing: Jest + Supertest (backend), Vitest (frontend)

## Backend setup

1. Open a terminal and navigate to `backend/`

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` with values like:

```env
MONGO_URI=mongodb://localhost:27017/Nexa
JWT_SECRET=yourSecret
JWT_EXPIRES_IN=1h
MONGO_URI_TEST=mongodb://localhost:27017/test_nexa
```

3. Start the backend server:

```bash
npm run dev
```

4. Confirm health endpoint:

```bash
curl http://localhost:8000/api/v1/health
```

## Frontend setup

1. Open a terminal and navigate to `frontend/`

```bash
cd frontend
npm install
```

2. Optional: create `frontend/.env` with the API base URL:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

3. Start the frontend app:

```bash
npm run dev
```

4. Open the app in the browser at the address shown by Vite.

## API endpoints

### Auth

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Authenticate a user

### Posts

- `GET /api/v1/posts` - List published posts
- `GET /api/v1/posts/feed` - Get the authenticated user feed
- `GET /api/v1/posts/:id` - Get single post
- `POST /api/v1/posts` - Create a post
- `PATCH /api/v1/posts/:id` - Update a post
- `DELETE /api/v1/posts/:id` - Delete a post
- `POST /api/v1/posts/:id/publish` - Publish a post
- `POST /api/v1/posts/:id/unpublish` - Unpublish a post
- `POST /api/v1/posts/:id/like` - Like a post
- `DELETE /api/v1/posts/:id/unlike` - Unlike a post

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current profile
- `DELETE /api/v1/users/me` - Delete current profile
- `GET /api/v1/users/:userId` - Get another user profile
- `GET /api/v1/users/:userId/posts` - Get a user's posts
- `POST /api/v1/users/follow/:userId` - Follow user
- `POST /api/v1/users/unfollow/:userId` - Unfollow user
- `GET /api/v1/users/following` - Get users you follow
- `GET /api/v1/users/followers` - Get your followers

### Comments and replies

- `GET /api/v1/comments/posts/:postId` - Get top-level comments for a post
- `POST /api/v1/comments/posts/:postId` - Create a new comment
- `GET /api/v1/comments/:commentId/replies` - Get replies for a comment
- `POST /api/v1/comments/:commentId/replies` - Reply to a comment
- `PATCH /api/v1/comments/:commentId` - Update a comment or reply
- `DELETE /api/v1/comments/:commentId` - Delete a comment or reply
- `POST /api/v1/comments/:commentId/like` - Like a comment or reply
- `DELETE /api/v1/comments/:commentId/unlike` - Unlike a comment or reply

## Notes

- The backend server listens on port `8000` by default.
- The frontend config supports a `VITE_API_BASE_URL` env variable and uses `/api/v1` routes.
- Ensure MongoDB is running locally or update `MONGO_URI` to point at your database.

## Running tests

- Backend:

```bash
cd backend
npm test
```

- Frontend:

```bash
cd frontend
npm test
```

## Development workflow

1. Start the backend.
2. Start the frontend.
3. Use the web app to create accounts, posts, comments, replies, and likes.

---

This README provides the current setup and API summary for the NEXA project. Enjoy building!