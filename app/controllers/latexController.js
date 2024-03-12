const fs = require('fs');
const Exam = require('../models/projectModel');

exports.uploadLatexFile = async (req, res) => {
  try {
    const latexContent = fs.readFileSync(req.file.path, 'utf-8');
    
    const questionsData = [];
    const questionRegex = /\\item\s+(.*?)\\begin\{(oneparchoices|enumerate)\}(.*?)\\end\{(oneparchoices|enumerate)\}/gs;

    let match;
    while ((match = questionRegex.exec(latexContent)) !== null) {
        const questionText = match[1].trim();
        // const questionText = katex.renderToString('\(\\left(\\dfrac{2}{5}\\right)^{-5}\\cdot \\left(\\dfrac{2}{5}\\right)^{3}\\cdot\\left(\\dfrac{5}{2}\\right)^4\) илэрхийллийн утгыг ол.');
        const choices = match[3].trim().split(/\s*\\choice|item\s*/).slice(1);
        // const choicesHtml = choices.map(choice => katex.renderToString(choice.replace(/\$/g, '')));
        questionsData.push({ questionText, choices: choices });
    }
    
    const newExam = new Exam({
        examName: 'New Exam',
        questions: questionsData,
    });

    await newExam.save();
    res.send('File uploaded and saved in MongoDB.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred during file upload.');
  }
};
