import mysql from "mysql2/promise"
import { v4 as uuidv4 } from "uuid"
const config = {
  host: "localhost",
  user: "root",
  port: 3306,
  password: "",
  database: "moviesdb",
}

const connection = await mysql.createConnection(config)

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
      const lowerCaseGenre = genre.toLowerCase()

      const [genres] = await connection.query(
        "Select id, name from genre where LOWER(name) = ?;",
        [lowerCaseGenre]
      )
      if (genres.length === 0) return []

      const [{ id: genreId }] = genres
      const [movies] = await connection.query(
        `SELECT 
          a.id, 
          a.title, 
          a.year, 
          a.director, 
          a.duration, 
          a.poster, 
          a.rate, 
          c.name AS genre 
        FROM movie a
        INNER JOIN movie_genres b ON b.movie_id = a.id
        INNER JOIN genre c ON c.id = b.genre_id
        WHERE b.genre_id = ?;`,
        [genreId]
      )
      return movies
    }

    const [movies] = await connection.query(
      "Select id, title, year, director, duration, poster, rate from movie;"
    )
    return movies
  }
  static async getById({ id }) {
    const [movies] = await connection.query(
      `Select id, title, year, director, duration, poster, rate from movie where id = ? `,
      [id]
    )
    if (movies.length === 0) return null
    return movies[0]
  }
  static async create({ input }) {
    const { title, year, duration, director, poster, rate } = input

    // Genera un UUID para el id
    //  const id = uuidv4()
    const [uuidResult] = await connection.query("Select UUID() as uuid;")
    const [{ uuid }] = uuidResult
    try {
      // Ejecuta la consulta de inserción
      const [result] = await connection.query(
        `INSERT INTO movie (id,title, year, director, duration, poster, rate)
       VALUES (?,?, ?, ?, ?, ?, ?);`,
        [uuid, title, year, director, duration, poster, rate]
      )
      console.log(result)
      const [movies] = await connection.query(
        "SELECT title, year, director, duration, poster, rate, id FROM movie WHERE id = ?;",
        [uuid]
      )
      return movies[0]
    } catch (error) {
      // Captura errores y lanza uno con un mensaje claro
      console.error("Error al crear la película:", error)
      throw new Error(
        "No se pudo crear la película. Verifica los datos y la conexión."
      )
    }
  }
  static async delete({ id }) {
    try {
      const [movies] = await connection.query(
        `Select id, title, year, director, duration, poster, rate from movie where id = ? `,
        [id]
      )
      if (movies.length === 0)
        throw new Error(`No se encontró la película con el id: ${id}`)
      const movieToDelete = movies[0]

      await connection.query(`Delete FROM movie WHERE id = ?;`, [id])
      return movieToDelete
    } catch (error) {
      throw new Error(
        "No se pudo eliminar la película. Verifica los datos y la conexión."
      )
    }
  }
  static async update({ id, input }) {
    try {
      // Verifica si la película existe en la base de datos
      const [movies] = await connection.query(
        `SELECT id, title, year, director, duration, poster, rate 
       FROM movie 
       WHERE id = ?;`,
        [id]
      )

      if (movies.length === 0) {
        throw new Error(`No se encontró la película con el id: ${id}`)
      }

      // Construye dinámicamente la consulta SQL y los valores
      const updates = Object.keys(input)
        .map((key) => `${key} = ?`)
        .join(", ")
      const values = [...Object.values(input), id]

      if (!updates) {
        throw new Error("No se proporcionaron campos para actualizar.")
      }

      // Ejecuta la consulta de actualización
      const updateQuery = `UPDATE movie SET ${updates} WHERE id = ?;`
      await connection.query(updateQuery, values)

      // Recupera la película actualizada
      const [updatedMovies] = await connection.query(
        `SELECT id, title, year, director, duration, poster, rate 
       FROM movie 
       WHERE id = ?;`,
        [id]
      )

      return updatedMovies[0]
    } catch (error) {
      console.error("Error al actualizar la película:", error)
      throw new Error(
        "No se pudo actualizar la película. Verifica los datos y la conexión."
      )
    }
  }
}
