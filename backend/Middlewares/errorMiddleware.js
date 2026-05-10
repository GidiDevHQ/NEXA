const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    return res.status(statusCode).json({
        status: 'error',
        message,
        error: process.env.NODE_ENV === 'development' ? undefined : err.stack,
    });
};

export default errorMiddleware;