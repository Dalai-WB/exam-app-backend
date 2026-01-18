// controllers/dashboard.controller.js
const mongoose = require('mongoose');
const { User, UserExam } = require('../models/projectModel');

const ObjectId = mongoose.Types.ObjectId;

/**
 * CATEGORY PERFORMANCE
 */
exports.getCategoryStats = async (req, res) => {
  const { fireId } = req.params;
  const { variant } = req.query;

  try {
    const user = await User.findOne({ fireId }).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pipeline = [
      { $match: { user: user._id } },

      // join exam to access variant
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },

      // filter by variant if provided
      ...(variant ? [{ $match: { "exam.variant": variant } }] : []),

      // take last 5 exams if variant is provided
      ...(variant ? [
        { $sort: { dateTaken: -1 } },
        { $limit: 5 }
      ] : []),

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
          correct: { $sum: { $cond: ["$responses.isCorrect", 1, 0] } }
        }
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          percentage: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] }
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ];

    const data = await UserExam.aggregate(pipeline);
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
  const { category, variant } = req.query;

  try {
    const user = await User.findOne({ fireId }).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pipeline = [
      { $match: { user: user._id } },

      // join exam to access variant
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },

      ...(variant ? [{ $match: { "exam.variant": variant } }] : []),
      ...(variant ? [
        { $sort: { dateTaken: -1 } },
        { $limit: 5 }
      ] : []),

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

      ...(category ? [{ $match: { "question.category": category } }] : []),

      {
        $group: {
          _id: "$question.subCategory",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$responses.isCorrect", 1, 0] } }
        }
      },

      {
        $project: {
          _id: 0,
          subCategory: "$_id",
          percentage: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] }
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ];

    const data = await UserExam.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * CORRECT / WRONG / SKIPPED SUMMARY
 */
exports.getAnswerSummary = async (req, res) => {
  const { fireId } = req.params;
  const { category, variant } = req.query;

  try {
    const user = await User.findOne({ fireId }).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pipeline = [
      { $match: { user: user._id } },

      // join exam to access variant
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },

      ...(variant ? [{ $match: { "exam.variant": variant } }] : []),
      ...(variant ? [
        { $sort: { dateTaken: -1 } },
        { $limit: 5 }
      ] : []),

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

      ...(category ? [{ $match: { "question.category": category } }] : []),

      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ["$responses.selectedAnswer", null] }, { $eq: ["$responses.selectedAnswer", ""] }] },
              "Skipped",
              { $cond: [{ $eq: ["$responses.isCorrect", true] }, "Correct", "Wrong"] }
            ]
          },
          count: { $sum: 1 }
        }
      },

      {
        $addFields: {
          sortOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", "Correct"] }, then: 1 },
                { case: { $eq: ["$_id", "Wrong"] }, then: 2 },
                { case: { $eq: ["$_id", "Skipped"] }, then: 3 }
              ],
              default: 99
            }
          }
        }
      },
      { $sort: { sortOrder: 1 } },
      { $project: { sortOrder: 0 } }
    ];

    const data = await UserExam.aggregate(pipeline);

    // return full summary object
    const summary = { Correct: 0, Wrong: 0, Skipped: 0 };
    data.forEach(d => (summary[d._id] = d.count));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EXAM TREND (LINE CHART)
 */
exports.getExamTrend = async (req, res) => {
  const { fireId } = req.params;

  try {
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = await UserExam.aggregate([
      { $match: { user: user._id } },

      // join Exam
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam"
        }
      },
      { $unwind: "$exam" },

      // project needed fields
      {
        $project: {
          dateTaken: 1,
          score: 1,
          variant: "$exam.variant",
          examName: "$exam.examName"
        }
      },

      { $sort: { dateTaken: 1 } },

      // group by variant
      {
        $group: {
          _id: "$variant",
          data: {
            $push: {
              dateTaken: "$dateTaken",
              score: "$score",
              examName: "$examName"
            }
          }
        }
      }
    ]);

    // array → object
    const result = data.reduce((acc, item) => {
      acc[item._id ?? 'Unknown'] = item.data;
      return acc;
    }, {});

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
