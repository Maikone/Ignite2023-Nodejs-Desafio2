import request from 'supertest'
import { beforeAll, afterAll, describe, it, beforeEach } from 'vitest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('User Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })
  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('it should be possible to create an user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'Michael William',
        email: 'michael@gmail.com',
      })
      .expect(201)
  })
})
