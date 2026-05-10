import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Follow from '../Models/Follow.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

describe('Post Endpoints', () => {
  let user1;
  let user2;
  let token1;
  let token2;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_nexa');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Follow.deleteMany({});

    const hashed1 = await bcrypt.hash('Password123!', 10);
    user1 = await User.create({
      first_name: 'Segun',
      last_name: 'Williams',
      username: 'segunwilliams',
      email: 'Williamssegun@gmail.com',
      password: hashed1
    });
    token1 = generateToken(user1);

    const hashed2 = await bcrypt.hash('Password123!', 10);
    user2 = await User.create({
      first_name: 'Gideon',
      last_name: 'Bamigbose',
      username: 'gideonbamigbose',
      email: 'Bamigbosegideon@gmail.com',
      password: hashed2
    });
    token2 = generateToken(user2);
  });

  describe('GET /api/v1/posts', () => {
    it('returns published posts', async () => {
      await Post.create({
        title: 'Published Post',
        content: 'Hello world',
        author: user1._id,
        state: 'published'
      });

      const res = await request(app).get('/api/v1/posts').expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].title).toBe('Published Post');
    });

    it('filters by author', async () => {
      await Post.create([
        { title: 'Post1', content: 'C1', author: user1._id, state: 'published' },
        { title: 'Post2', content: 'C2', author: user2._id, state: 'published' }
      ]);

      const res = await request(app)
        .get(`/api/v1/posts?author=${user1._id}`)
        .expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].author._id).toBe(user1._id.toString());
    });

    it('searches by title and tags', async () => {
      await Post.create({
        title: 'Searchable Title',
        content: 'hello',
        tags: ['fun', 'test'],
        author: user1._id,
        state: 'published'
      });

      const res = await request(app)
        .get('/api/v1/posts?title=searchable&tags=test')
        .expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].title).toBe('Searchable Title');
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('returns a published post with author info', async () => {
      const post = await Post.create({
        title: 'Single Post',
        content: 'Content',
        author: user1._id,
        state: 'published'
      });

      const res = await request(app).get(`/api/v1/posts/${post._id}`).expect(200);

      expect(res.body.post.title).toBe('Single Post');
      expect(res.body.post.author.username).toBe('segunwilliams');
    });
  });

  describe('POST /api/v1/posts', () => {
    it('creates a draft post for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Draft', content: 'content', tags: ['tag1'] })
        .expect(201);

      expect(res.body.post.state).toBe('draft');
      expect(res.body.post.author).toBe(user1._id.toString());
    });
  });

  describe('PATCH /api/v1/posts/:id', () => {
    it('edits own post', async () => {
      const post = await Post.create({
        title: 'Old',
        content: 'Old content',
        author: user1._id,
        state: 'draft'
      });

      const res = await request(app)
        .patch(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(res.body.post.title).toBe('New Title');
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('deletes own post', async () => {
      const post = await Post.create({
        title: 'Remove',
        content: 'Remove content',
        author: user1._id,
        state: 'draft'
      });

      await request(app)
        .delete(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const found = await Post.findById(post._id);
      expect(found).toBeNull();
    });
  });

  describe('POST /api/v1/posts/:id/publish', () => {
    it('publishes a draft post', async () => {
      const post = await Post.create({
        title: 'Draft Post',
        content: 'Content',
        author: user1._id,
        state: 'draft'
      });

      await request(app)
        .post(`/api/v1/posts/${post._id}/publish`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const updated = await Post.findById(post._id);
      expect(updated.state).toBe('published');
    });
  });

  describe('POST /api/v1/posts/:id/unpublish', () => {
    it('unpublishes a post back to draft', async () => {
      const post = await Post.create({
        title: 'Published',
        content: 'Content',
        author: user1._id,
        state: 'published'
      });

      await request(app)
        .post(`/api/v1/posts/${post._id}/unpublish`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const updated = await Post.findById(post._id);
      expect(updated.state).toBe('draft');
    });
  });

  describe('POST /api/v1/posts/:id/like', () => {
    it('likes a published post once', async () => {
      const post = await Post.create({
        title: 'Likeable',
        content: 'Content',
        author: user1._id,
        state: 'published'
      });

      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(res.body.like_count).toBe(1);
    });

    it('returns 400 when liking twice', async () => {
      const post = await Post.create({
        title: 'Already liked',
        content: 'Content',
        author: user1._id,
        state: 'published',
        likes: [user2._id],
        like_count: 1
      });

      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(400);

      expect(res.body.message).toBe('You have already liked this post');
    });
  });

  describe('DELETE /api/v1/posts/:id/unlike', () => {
    it('unlikes a post', async () => {
      const post = await Post.create({
        title: 'Unlike',
        content: 'Content',
        author: user1._id,
        state: 'published',
        likes: [user2._id],
        like_count: 1
      });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/unlike`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(res.body.like_count).toBe(0);
    });
  });

  describe('GET /api/v1/posts/feed', () => {
    it('returns published posts from following users and self', async () => {
      await Follow.create({ follower: user1._id, following: user2._id });
      await Post.create({
        title: 'Following Post',
        content: 'Content',
        author: user2._id,
        state: 'published'
      });

      const res = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].author.username).toBe('gideonbamigbose');
    });
  });
});