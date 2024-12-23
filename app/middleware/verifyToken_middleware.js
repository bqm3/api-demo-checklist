const asyncHandler = require('express-async-handler')
const isAdmin = asyncHandler((req, res, next) => {
    const { ID_Chucvu } = req.user
    if (ID_Chucvu !== 1)
        return res.status(401).json({
            success: false,
            message: 'Không có quyền truy cập'
        })
    next()
})

module.exports = {isAdmin}