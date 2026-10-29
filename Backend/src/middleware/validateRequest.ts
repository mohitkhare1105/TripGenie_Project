import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: ValidationErrorItem[];
  data: null;
}

/**
 * Format Zod issues into structured field/message pairs.
 * Handles nested dot paths and unrecognized key errors from strict schemas.
 */
export const formatZodIssues = (issues: ZodIssue[]): ValidationErrorItem[] => {
  const formattedErrors: ValidationErrorItem[] = [];

  for (const issue of issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        formattedErrors.push({
          field: key,
          message: `Unexpected property '${key}' is not allowed`,
        });
      }
    } else {
      const fieldPath = issue.path.join('.');
      formattedErrors.push({
        field: fieldPath.length > 0 ? fieldPath : 'body',
        message: issue.message,
      });
    }
  }

  return formattedErrors;
};

/**
 * Reusable Express middleware for validating request bodies against a Zod schema.
 * Replaces req.body with the parsed and normalized data on success.
 * Returns HTTP 400 with a structured error response on validation failure.
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const response: ValidationErrorResponse = {
        success: false,
        message: 'Validation failed',
        errors: formatZodIssues(result.error.issues),
        data: null,
      };

      res.status(400).json(response);
      return;
    }

    // Assign parsed & normalized data so downstream controllers receive clean data
    req.body = result.data;
    next();
  };
};

