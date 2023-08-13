// eslint-disable-next-line
import { Knex } from 'knex'
// ou faça apenas:
// import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      password: string
      session_id?: string
    }

    meals: {
      id: string
      name: string
      description?: string
      timeMeal: Date
      diet: boolean
    }
  }
}
