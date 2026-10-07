import HttpError from "../utils/HttpError.js"

// validate(schema) parses req.body with a zod schema and replaces it with the
// cleaned result; invalid input becomes a 400 with the first issue's message.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {})
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.join(".")
    return next(new HttpError(400, field ? `${field}: ${issue.message}` : issue.message))
  }
  req.body = result.data
  next()
}
