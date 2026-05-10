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

describe('User Endpoints', () => {
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

  describe('GET /api/v1/users/me', () => {
    it('returns current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.user.username).toBe('segunwilliams');
      expect(res.body.user).not.toHaveProperty('password');
    });
  });

  describe('GET /api/v1/users/me/posts', () => {
    it('returns own posts', async () => {
      await Post.create([
        { title: 'Draft', content: 'C', author: user1._id, state: 'draft' },
        { title: 'Published', content: 'C', author: user1._id, state: 'published' }
      ]);

      const res = await request(app)
        .get('/api/v1/users/me/posts')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.posts.length).toBe(2);
    });

    it('filters own posts by state', async () => {
      await Post.create([
        { title: 'Draft', content: 'C', author: user1._id, state: 'draft' },
        { title: 'Published', content: 'C', author: user1._id, state: 'published' }
      ]);

      const res = await request(app)
        .get('/api/v1/users/me/posts?state=published')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].state).toBe('published');
    });
  });

  describe('POST /api/v1/users/follow/:userId', () => {
    it('follows another user', async () => {
      const res = await request(app)
        .post(`/api/v1/users/follow/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(201);

      expect(res.body.message).toBe('Now following this user');
    });

    it('does not allow following self', async () => {
      const res = await request(app)
        .post(`/api/v1/users/follow/${user1._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(res.body.message).toBe('You cannot follow yourself');
    });

    it('does not allow duplicate follow', async () => {
      await Follow.create({ follower: user1._id, following: user2._id });

      const res = await request(app)
        .post(`/api/v1/users/follow/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(409);

      expect(res.body.message).toBe('Already following this user');
    });
  });

  describe('POST /api/v1/users/unfollow/:userId', () => {
    it('unfollows a user', async () => {
      await Follow.create({ follower: user1._id, following: user2._id });

      const res = await request(app)
        .post(`/api/v1/users/unfollow/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.message).toBe('Unfollowed user successfully');
    });
  });

  describe('GET /api/v1/users/following', () => {
    it('returns following list', async () => {
      await Follow.create({ follower: user1._id, following: user2._id });

      const res = await request(app)
        .get('/api/v1/users/following')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].username).toBe('gideonbamigbose');
    });
  });

  describe('GET /api/v1/users/followers', () => {
    it('returns followers list', async () => {
      await Follow.create({ follower: user2._id, following: user1._id });

      const res = await request(app)
        .get('/api/v1/users/followers')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].username).toBe('gideonbamigbose');
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('returns public user profile', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${user2._id}`)
        .expect(200);

      expect(res.body.user.username).toBe('gideonbamigbose');
    });
  });

  describe('GET /api/v1/users/:userId/posts', () => {
    it('returns published posts for another user', async () => {
      await Post.create({
        title: 'Public Post',
        content: 'Content',
        author: user2._id,
        state: 'published'
      });

      const res = await request(app)
        .get(`/api/v1/users/${user2._id}/posts`)
        .expect(200);

      expect(res.body.posts.length).toBe(1);
      expect(res.body.posts[0].author).toBe(user2._id.toString());
    });
  });
});