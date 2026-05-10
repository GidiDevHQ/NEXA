import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import app from '../server.js';
import User from '../Models/User.js';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_nexa');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Segun',
          lastName: 'Williams',
          username: 'segunwilliams',
          email: 'Williamssegun@gmail.com',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'segunwilliams');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user.email).toBe('williamssegun@gmail.com');
    });

    it('returns 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'Williamssegun@gmail.com' })
        .expect(400);

      expect(response.body.message).toBe('All fields are required');
    });

    it('returns 400 when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Segun',
          lastName: 'Williams',
          username: 'segunwilliams',
          email: 'Williamssegun@gmail.com',
          password: 'Password123!',
          confirmPassword: 'Password321!'
        })
        .expect(400);

      expect(response.body.message).toBe('Passwords do not match');
    });

    it('returns 400 for duplicate username/email', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      await User.create({
        first_name: 'Segun',
        last_name: 'Williams',
        username: 'segunwilliams',
        email: 'Williamssegun@gmail.com',
        password: hashed
      });

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Gideon',
          lastName: 'Bamigbose',
          username: 'segunwilliams',
          email: 'Bamigbosegideon@gmail.com',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        })
        .expect(400);

      expect(response.body.message).toBe('Email or username already exists');
    });
  });

  describe('POST /api/v1/auth/signin', () => {
    beforeEach(async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      await User.create({
        first_name: 'Segun',
        last_name: 'Williams',
        username: 'segunwilliams',
        email: 'Williamssegun@gmail.com',
        password: hashed
      });
    });

    it('signs in a user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({ email: 'Williamssegun@gmail.com', password: 'Password123!' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'segunwilliams');
    });

    it('returns 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({ email: 'bad@example.com', password: 'Password123!' })
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('returns 400 for wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({ email: 'Williamssegun@gmail.com', password: 'WrongPass123' })
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});