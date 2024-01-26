// Higher Order Function
// Will accept or return function or both

// const HOF = (fn) => fn2

// const HOF = (fn) => (parameters, of, fn) => {
//     something = fn(parameters, of, fn)
//     return something
// }

const asyncHandler = (requestHandler) => (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
}


//  By try catch method
// (err, req, res, next)
// const asyncHandler = (fn) => async (req, res, next) => {
// try {
//     await fn(req, res, next)
// } catch (error) {
//     res.status(error.code || 500).json({
//         success: false,
//         message: err.message
//     })
// }
// }


export {asyncHandler}