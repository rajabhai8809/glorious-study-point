const Result = require('../models/Result');
const User = require('../models/User');
const sendResponse = require('../utils/response');

// Helper to get rankings for a specific date filter
const getRankings = async (matchFilter, subject) => {
    const pipeline = [];

    // 1. Filter by Subject if provided (requires lookup)
    if (subject && subject !== 'all') {
        pipeline.push(
            { $lookup: { from: "exams", localField: "examId", foreignField: "_id", as: "examInfo" } },
            { $unwind: "$examInfo" },
            { $match: { "examInfo.subject": { $regex: new RegExp(`^${subject}$`, 'i') } } } // Case-insensitive match
        );
    }

    // 2. Apply Date Filter and Grouping
    pipeline.push(
        { $match: matchFilter },
        {
            $group: {
                _id: "$userId",
                totalScore: { $sum: "$score" },
                totalCorrect: { $sum: "$correctAnswers" },
                examsTaken: { $sum: 1 }
            }
        },
        { $sort: { totalScore: -1, totalCorrect: -1 } },
        { $limit: 100 }, // Limit to top 100 for performance
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 1, // userId
                name: "$user.name",
                avatar: "$user.profileImage",
                score: "$totalScore",
                exams: "$examsTaken"
            }
        }
    );

    return await Result.aggregate(pipeline);
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { timeframe, subject } = req.query;
        
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        let currentFilter = {};
        let previousFilter = {};

        if (timeframe === 'weekly') {
            // Current: Last 7 days
            currentFilter = { 
                $or: [{ submittedAt: { $gte: oneWeekAgo } }, { createdAt: { $gte: oneWeekAgo } }] 
            };
            // Previous: 7 days before that
            previousFilter = { 
                $or: [
                    { submittedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } },
                    { createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } }
                ]
            };
        } else {
            // All Time
            currentFilter = {}; // All data
            previousFilter = { submittedAt: { $lt: oneWeekAgo } }; // All data up to last week
        }

        // Fetch both rankings
        const [currentRankings, previousRankings] = await Promise.all([
            getRankings(currentFilter, subject),
            getRankings(previousFilter, subject)
        ]);

        // Map previous ranks for quick lookup
        const prevRankMap = new Map();
        previousRankings.forEach((item, index) => {
            prevRankMap.set(item._id.toString(), index + 1);
        });

        // Calculate rank changes
        const leaderboard = currentRankings.map((item, index) => {
            const currentRank = index + 1;
            const prevRank = prevRankMap.get(item._id.toString());
            let rankChange = 0;
            
            if (prevRank) {
                rankChange = prevRank - currentRank; // Positive means moved up (e.g. 5 -> 2 = +3)
            } else {
                rankChange = 'new'; // New entry
            }

            return {
                ...item,
                rank: currentRank,
                rankChange
            };
        });
        
        const topThree = leaderboard.slice(0, 3);
        const rest = leaderboard.slice(3, 50); // Limit rest list
        
        let userRank = null;
        if (req.user) {
            const userIndex = leaderboard.findIndex(u => u._id.toString() === req.user._id.toString());
            if (userIndex !== -1) {
                const item = leaderboard[userIndex];
                userRank = {
                    position: item.rank,
                    score: item.score,
                    rankChange: item.rankChange,
                    percentile: Math.round(((leaderboard.length - userIndex) / leaderboard.length) * 100)
                };
            }
        }

        sendResponse(res, 200, true, {
            topThree,
            rest,
            userRank
        });
    } catch (err) {
        sendResponse(res, 500, false, null, err.message);
    }
};