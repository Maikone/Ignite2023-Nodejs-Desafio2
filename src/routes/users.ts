import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    /* zod é usado para o que esperado da requisição */
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
    })
    /* conferindo se deu bom o parse dara erro igual ao throw */
    const { name, email } = createUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get('/', async () => {
    const user = await knex('users').select()
    return { user }
  })

  app.get('/:id', async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users')
      .where({
        // eslint-disable-next-line object-shorthand
        id: id,
      })
      .first()

    return { user }
  })

  app.delete('/:id', async (request, reply) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getUserParamsSchema.parse(request.params)

    await knex('users').where('id', id).delete()

    reply.status(204).send()
  })
}
