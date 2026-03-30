const successResponse = (
  res,
  message = 'Success',
  data = null,
  statusCode = 200
) => {
  const response = { success: true, message };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (
  res,
  message = 'Something went wrong',
  statusCode = 500,
  error = null
) => {
  const response = { success: false, message };

  if (error !== null && error !== undefined) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };