/**
 * Standardized API Response
 */
const sendResponse = (res, statusCode, success, data = null, message = '') => {
    const response = {
        success,
        message,
        data
    };
    
    res.status(statusCode).json(response);
};

module.exports = sendResponse;