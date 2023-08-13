import request from 'supertest'
import { beforeAll, afterAll, describe, it, beforeEach, expect } from 'vitest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Meals Routes', () => {
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

  it('should not be possible to create a meal without user identification', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'Salada',
        description: 'Salada com Alface e Tomate',
        timeMeal: '2023-08-08',
        diet: true,
      })
      .expect(401)
  })

  it('should be possible to create an meal', async () => {
    const UserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Michael William',
        email: 'michael@gmail.com',
      })
      .expect(201)

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Salada',
        description: 'Salada com Alface e Tomate',
        timeMeal: '2023-08-08',
        diet: true,
      })
      .expect(201)
  })

  /// ///////
  it('should be possible to list all meals of a specific user', async () => {
    const UserResponse = await request(app.server).post('/users').send({
      name: 'Michael William',
      email: 'michael@gmail.com',
    })

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Salada',
      description: 'Salada com Alface e Tomate',
      timeMeal: '2023-08-08T12:34:56Z',
      diet: true,
    })

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Salada',
        description: 'Salada com Alface e Tomate',
        diet: 1,
      }),
    ])
  })

  it('should be possible to get one specific meal', async () => {
    const UserResponse = await request(app.server).post('/users').send({
      name: 'Michael William',
      email: 'michael@gmail.com',
    })

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Salada',
      description: 'Salada com Alface e Tomate',
      timeMeal: '2023-08-08T12:34:56Z',
      diet: true,
    })

    const listMealsResponse = await request(app.server)
      .get(`/meals`)
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meals).toEqual(
      expect.objectContaining({
        name: 'Salada',
        description: 'Salada com Alface e Tomate',
        diet: 1,
      }),
    )
  })

  it('should be possible to delete one meal', async () => {
    const UserResponse = await request(app.server).post('/users').send({
      name: 'Michael William',
      email: 'michael@gmail.com',
    })

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Salada',
      description: 'Salada com Alface e Tomate',
      timeMeal: '2023-08-08T12:34:56Z',
      diet: true,
    })

    const listMealsResponse = await request(app.server)
      .get(`/meals`)
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(204)
  })

  it('should be possible to edit one meal', async () => {
    const UserResponse = await request(app.server).post('/users').send({
      name: 'Michael William',
      email: 'michael@gmail.com',
    })

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Salada',
      description: 'Salada com Alface e Tomate',
      timeMeal: '2023-08-08T12:34:56Z',
      diet: true,
    })

    const listMealsResponse = await request(app.server)
      .get(`/meals`)
      .set('Cookie', cookies)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send({
        name: 'Salada salgada',
        description: 'Salada com Alface e Tomate com sal',
        timeMeal: '2023-08-10T12:34:56Z',
        diet: false,
      })
      .expect(204)

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getMealResponse.body.meals).toEqual(
      expect.objectContaining({
        name: 'Salada salgada',
        description: 'Salada com Alface e Tomate com sal',
        diet: 0,
      }),
    )
  })

  it('should be possible to list best sequencies meals', async () => {
    const UserResponse = await request(app.server).post('/users').send({
      name: 'Michael William',
      email: 'michael@gmail.com',
    })

    const cookies = UserResponse.get('Set-Cookie')

    await request(app.server).post('/meals').set('Cookie', cookies).send({
      name: 'Salada',
      description: 'Salada com Alface e Tomate',
      timeMeal: '2023-08-08T12:34:56Z',
      diet: true,
    })

    const listMealsResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body).toEqual(
      expect.objectContaining({
        totalMeals: 1,
        totalMealsOnDiet: 1,
        totalMealsOffDiet: 0,
        bestSequence: 1,
      }),
    )
  })
})
