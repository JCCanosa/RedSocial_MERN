const Follow = require('../models/follow')

const followUserIds = async (identityUserId) => {
    try {
        // Sacar info seguimiento
        let following = await Follow.find({ 'user': identityUserId })
            .select({ 'followed': 1, '_id': 0 })
            .exec()

        let followers = await Follow.find({ 'followed': identityUserId })
            .select({ 'user': 1, '_id': 0 })
            .exec()
        
        // Procesar array de ids
        let following_clean = []
        
        following.forEach(follow => {
            following_clean.push(follow.followed)
        })

        let followers_clean = []
        
        followers.forEach(follow => {
            followers_clean.push(follow.user)
        })

        return {
            following: following_clean,
            followers: followers_clean,
        }
    }
    catch (error) {
        return {}
    }
}

const followThisUser = async (identityUserId, profileUserId) => {
    // Sacar info seguimiento
    let following = await Follow.findOne({ 'user': identityUserId, 'followed': profileUserId })

    let follower = await Follow.findOne({ 'followed': identityUserId, 'user': profileUserId })

    return {
        following,
        follower
    }
}

module.exports = {
    followUserIds,
    followThisUser
}