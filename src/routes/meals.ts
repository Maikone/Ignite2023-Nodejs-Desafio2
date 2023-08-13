import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exits'

export async function mealsRoutes(app: FastifyInstance) {
  const getMealBodyParams = z.object({
    id: z.string().uuid(),
  })

  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        timeMeal: z.coerce.date(),
        diet: z.coerce.boolean(),
      })

      const { name, description, timeMeal, diet } = createMealBodySchema.parse(
        request.body,
      )

      const { sessionId } = request.cookies

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        time_meal: timeMeal,
        diet,
        user_id: sessionId,
      })
      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        timeMeal: z.coerce.date().optional(),
        diet: z.coerce.boolean().optional(),
      })
      const { sessionId } = request.cookies

      const { name, description, timeMeal, diet } = updateMealBodySchema.parse(
        request.body,
      )

      const { id } = getMealBodyParams.parse(request.params)

      await knex('meals')
        .update({
          name,
          description,
          time_meal: timeMeal,
          diet,
        })
        .where({
          id,
          user_id: sessionId,
        })
      return reply.status(204).send()
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals').where({
        user_id: sessionId,
      })
      return { meals }
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getUserParamsSchema.parse(request.params)
      const { sessionId } = request.cookies
      await knex('meals')
        .where({
          // eslint-disable-next-line object-shorthand
          id: id,
          user_id: sessionId,
        })
        .delete()

      reply.status(204).send()
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getUserParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getUserParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const meals = await knex('meals')
        .where({
          // eslint-disable-next-line object-shorthand
          id: id,
          user_id: sessionId,
        })
        .first()

      return { meals }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const totalMeals = await knex('meals')
        .where('user_id', sessionId)
        .count('*', { as: 'totalMeals' })
        .first()

      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: sessionId,
          diet: true,
        })
        .count('*', { as: 'totalMealsOnDiet' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({
          user_id: sessionId,
          diet: false,
        })
        .count('*', { as: 'totalMealsOffDiet' })
        .first()

      const allMeals = await knex('meals')
        .columns('time_meal', 'diet')
        .where({
          user_id: sessionId,
        })
        .orderBy('time_meal', 'asc')

      const sequences: number[] = []
      let currentSequence = 0
      let bestSequence = 0

      allMeals.forEach((meal) => {
        if (meal.diet) {
          currentSequence++
        } else {
          sequences.push(currentSequence)
          bestSequence = Math.max(bestSequence, currentSequence)
          currentSequence = 0
        }
      })

      sequences.push(currentSequence)
      bestSequence = Math.max(bestSequence, currentSequence)

      return {
        ...totalMeals,
        ...totalMealsOnDiet,
        ...totalMealsOffDiet,
        bestSequence,
      }
    },
  )
}
