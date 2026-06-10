import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateSchema = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove the prefix 'body' or 'query'
          message: err.message,
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      return res.status(500).json({ message: 'Internal validation failure' });
    }
  };
};
