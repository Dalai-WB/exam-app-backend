// controllers/dashboard.controller.js
const mongoose = require('mongoose');
const { User, UserExam } = require('../models/projectModel');

const ObjectId = mongoose.Types.ObjectId;

/**
 * CATEGORY PERFORMANCE
 */
exports.getCategoryStats = async (req, res) => {
  const { fireId } = req.params;

  const user = await User.findOne({ fireId });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const data = await UserExam.aggregate([
      { $match: { user: user._id } },
      { $unwind: "$responses" },

      {
        $lookup: {
          from: "questions",
          localField: "responses.question",
          foreignField: "_id",
          as: "question"
        }
      },
      { $unwind: "$question" },

      {
        $group: {
          _id: "$question.category",
          total: { $sum: 1 },
          correct: {
            $sum: { $cond: ["$responses.isCorrect", 1, 0] }
          }
        }
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          percentage: {
            $round: [
              { $multiply: [{ $divide: ["$correct", "$total"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * SUB-CATEGORY PERFORMANCE
 */
exports.getSubCategoryStats = async (req, res) => {
  const { fireId } = req.params;
  const { category } = req.query;

  try {
    const user = await User.findOne({ fireId }).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pipeline = [
      { $match: { user: user._id } },
      { $unwind: "$responses" },

      {
        $lookup: {
          from: "questions",
          localField: "responses.question",
          foreignField: "_id",
          as: "question"
        }
      },
      { $unwind: "$question" }
    ];

    // ✅ FILTER BY CLICKED CATEGORY
    if (category) {
      pipeline.push({
        $match: { "question.category": category }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$question.subCategory",
          total: { $sum: 1 },
          correct: {
            $sum: { $cond: ["$responses.isCorrect", 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          subCategory: "$_id",
          percentage: {
            $round: [
              { $multiply: [{ $divide: ["$correct", "$total"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    );

    res.json(await UserExam.aggregate(pipeline));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * CORRECT / WRONG / SKIPPED
 */
exports.getAnswerSummary = async (req, res) => {
  const { fireId } = req.params;

  const user = await User.findOne({ fireId });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const data = await UserExam.aggregate([
      { $match: { user: user._id } },
      { $unwind: "$responses" },

      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$responses.selectedAnswer", null] },
              "Skipped",
              {
                $cond: [
                  "$responses.isCorrect",
                  "Correct",
                  "Wrong"
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EXAM TREND (LINE CHART)
 */
exports.getExamTrend = async (req, res) => {
  const { fireId } = req.params;

  const user = await User.findOne({ fireId });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const data = await UserExam.aggregate([
      { $match: { user: user._id } },
      {
        $project: {
          dateTaken: 1,
          score: 1
        }
      },
      { $sort: { dateTaken: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
