const Joi = require('joi');

const calculationSchema = Joi.object({
  area: Joi.number().positive().required().messages({
    'number.base': 'Area must be a number',
    'number.positive': 'Area must be greater than 0',
    'any.required': 'Area is required'
  }),
  materialType: Joi.string().valid(
    'cement', 'bricks', 'concrete', 'painting', 'tiles', 'steel', 'blocks', 'gravel', 'roofing'
  ).required().messages({
    'any.only': 'Invalid material type selected',
    'any.required': 'Material type is required'
  }),
  thickness: Joi.number().min(0).when('materialType', {
    is: Joi.valid('concrete', 'steel', 'gravel'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'number.base': 'Thickness must be a number',
    'number.min': 'Thickness must be positive',
    'any.required': 'Thickness is required for this material type'
  }),
  tileSize: Joi.number().positive().when('materialType', {
    is: 'tiles',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'number.base': 'Tile size must be a number',
    'number.positive': 'Tile size must be positive',
    'any.required': 'Tile size is required for tiles'
  }),
  roomWidth: Joi.number().min(0).optional(),
  roomHeight: Joi.number().min(0).optional(),
  roomLength: Joi.number().min(0).optional()
});

const healthCheckSchema = Joi.object({
  // No parameters needed for health check
});

module.exports = {
  calculationSchema,
  healthCheckSchema
};