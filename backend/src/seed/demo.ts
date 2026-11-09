import bcrypt from 'bcrypt';
import { User } from '../users/user.model.js';
import { ResponseModel } from '../responses/response.model.js';
import { Rubric } from '../rubrics/rubric.model.js';
import { Evaluation } from '../evaluations/evaluation.model.js';

export const DEMO_EMAIL = 'demo@example.com';
export const DEMO_PASSWORD = 'Demo@1234';

type RubricKey = 'general' | 'code' | 'tone';
// r = rubric, d = how many days ago it was evaluated, q = overall quality 1-5 (scores are derived from it)
interface Ev { r: RubricKey; d: number; q: number }
interface Seed { type: string; prompt: string; response: string; evals?: Ev[] }

const rubricDefs: Record<RubricKey, { name: string; description: string; criteria: [string, string][] }> = {
  general: {
    name: 'General Quality',
    description: 'Overall quality of an assistant answer',
    criteria: [
      ['Relevance', 'Does the answer address the prompt?'],
      ['Clarity', 'Is the answer easy to understand?'],
      ['Accuracy', 'Is the information factually correct?'],
      ['Helpfulness', 'Would the answer help the user?'],
    ],
  },
  code: {
    name: 'Code Answer Quality',
    description: 'For programming and technical answers',
    criteria: [
      ['Correctness', 'Is the technical content correct?'],
      ['Explanation', 'Is the reasoning explained clearly?'],
      ['Best Practices', 'Does it follow good engineering practice?'],
    ],
  },
  tone: {
    name: 'Tone & Safety',
    description: 'For customer-facing and writing tasks',
    criteria: [
      ['Politeness', 'Is the tone courteous?'],
      ['Empathy', 'Does it acknowledge the reader’s situation?'],
      ['Professionalism', 'Is it appropriate for a work setting?'],
    ],
  },
};

const data: Seed[] = [
  // --- general ---
  { type: 'general', prompt: 'What is the capital of Australia?', response: 'The capital of Australia is Canberra, not Sydney or Melbourne as many people assume.', evals: [{ r: 'general', d: 4, q: 5 }] },
  { type: 'general', prompt: 'Explain photosynthesis simply.', response: 'Plants use sunlight, water and carbon dioxide to make sugar for energy, and release oxygen as a by-product.', evals: [{ r: 'general', d: 2, q: 5 }] },
  { type: 'general', prompt: 'Give me tips for a job interview.', response: 'Be yourself and good luck, interviews can be hard.', evals: [{ r: 'general', d: 12, q: 2 }] },
  { type: 'general', prompt: 'Summarise the causes of World War I.', response: 'Militarism, alliances, imperialism and nationalism raised tensions; the assassination of Archduke Franz Ferdinand in 1914 triggered the war.', evals: [{ r: 'general', d: 6, q: 4 }] },
  { type: 'general', prompt: 'Recommend a healthy breakfast.', response: 'Oatmeal with berries and nuts gives fibre, vitamins and protein. Add yogurt for extra protein.', evals: [{ r: 'general', d: 8, q: 4 }] },
  { type: 'general', prompt: 'Who wrote Pride and Prejudice?', response: 'It was written by Charlotte Bronte in 1847.', evals: [{ r: 'general', d: 11, q: 2 }] },
  { type: 'general', prompt: 'How do vaccines work?', response: 'They are good for health.', evals: [{ r: 'general', d: 12, q: 1 }] },
  { type: 'general', prompt: 'Suggest a name for a coffee shop.', response: 'How about "Daily Grind"? It is short, memorable and fits the coffee theme.', evals: [{ r: 'general', d: 10, q: 3 }] },
  { type: 'general', prompt: 'Why is the sky blue?', response: 'Air molecules scatter short blue wavelengths of sunlight more than longer red ones, so blue light reaches your eyes from every direction.', evals: [{ r: 'general', d: 1, q: 5 }] },
  { type: 'general', prompt: 'What causes inflation?', response: 'Prices go up when there is too much money and not enough goods. There are other causes too.', evals: [{ r: 'general', d: 9, q: 3 }] },
  { type: 'general', prompt: 'How do I stay focused while studying?', response: 'Study in 25-minute blocks with short breaks, silence notifications, and set one clear goal per session.', evals: [{ r: 'general', d: 5, q: 4 }] },
  { type: 'general', prompt: 'Tell me about the Great Wall of China.', response: 'The Great Wall is a series of fortifications built over many centuries across northern China, stretching thousands of kilometres.' },
  { type: 'general', prompt: 'What is a good way to learn guitar?', response: 'Start with basic open chords, practise 15-20 minutes daily, and learn songs you enjoy.' },
  { type: 'general', prompt: 'Explain blockchain to a 10-year-old.', response: 'Imagine a notebook that everyone in class has a copy of. When someone writes something new, everybody updates their copy, so nobody can cheat.' },
  // --- math ---
  { type: 'math', prompt: 'What is 15% of 240?', response: '15% of 240 is 36.', evals: [{ r: 'general', d: 3, q: 5 }] },
  { type: 'math', prompt: 'Solve 2x + 6 = 14.', response: 'Subtract 6 to get 2x = 8, then divide by 2: x = 4.', evals: [{ r: 'general', d: 1, q: 5 }] },
  { type: 'math', prompt: 'What is the derivative of x^2?', response: 'The derivative of x^2 is 2x.', evals: [{ r: 'general', d: 0, q: 5 }] },
  { type: 'math', prompt: 'What is 7 times 8?', response: '7 times 8 is 56, so seven eights make fifty-six.', evals: [{ r: 'general', d: 7, q: 3 }] },
  { type: 'math', prompt: 'What is the square root of 144?', response: '12.' },
  // --- coding ---
  { type: 'coding', prompt: 'How do I reverse a string in Python?', response: 'Use slicing: `s[::-1]`. It creates a reversed copy of the string.', evals: [{ r: 'code', d: 6, q: 4 }] },
  { type: 'coding', prompt: 'What does `git rebase` do?', response: 'It moves your commits onto a new base commit, replaying them to create a linear history. Avoid rebasing shared branches.', evals: [{ r: 'code', d: 4, q: 4 }] },
  { type: 'coding', prompt: 'What is a closure in JavaScript?', response: 'A closure is when a function is closed. It is used for closing things.', evals: [{ r: 'code', d: 9, q: 1 }, { r: 'general', d: 9, q: 1 }] },
  { type: 'coding', prompt: 'Explain SQL joins.', response: 'Joins combine rows from two tables. INNER keeps matches only; LEFT keeps all left rows plus matches; FULL keeps everything.', evals: [{ r: 'code', d: 3, q: 4 }] },
  { type: 'coding', prompt: 'What is the time complexity of binary search?', response: 'Binary search is O(n) because it looks at every element.', evals: [{ r: 'code', d: 8, q: 2 }] },
  { type: 'coding', prompt: 'Explain what a REST API is.', response: 'A REST API exposes resources at URLs and uses HTTP methods (GET, POST, PUT, DELETE) to read and change them, with each request being stateless.', evals: [{ r: 'code', d: 1, q: 5 }] },
  { type: 'coding', prompt: 'What does async/await do in JavaScript?', response: 'It lets you write asynchronous code that looks synchronous: await pauses an async function until a Promise settles, without blocking the main thread.', evals: [{ r: 'code', d: 2, q: 5 }] },
  { type: 'coding', prompt: 'How do I center a div in CSS?', response: 'Make the parent a flex container and use justify-content: center and align-items: center.' },
  { type: 'coding', prompt: 'Write a Python function that checks for a palindrome.', response: 'def is_palindrome(s):\n    s = "".join(ch.lower() for ch in s if ch.isalnum())\n    return s == s[::-1]' },
  // --- writing / support ---
  { type: 'writing', prompt: 'Write a polite email declining a job offer.', response: 'Dear Ms. Patel, thank you sincerely for the offer. After careful thought I have decided to decline, as it is not the right fit at this time. I appreciate your time and wish the team every success.', evals: [{ r: 'tone', d: 5, q: 5 }] },
  { type: 'support', prompt: 'Reply to an angry customer whose order was late.', response: "Calm down, it's not our fault. Couriers are slow.", evals: [{ r: 'tone', d: 7, q: 2 }] },
  { type: 'writing', prompt: 'Write a friendly welcome message for new users.', response: 'Welcome aboard! We are so glad you are here. Take a look around, and reach out any time if you need a hand.', evals: [{ r: 'tone', d: 4, q: 4 }] },
  { type: 'support', prompt: 'Respond to a customer asking for a refund.', response: 'Refunds are not possible. Read our policy.', evals: [{ r: 'tone', d: 6, q: 2 }] },
  { type: 'writing', prompt: 'Draft an apology for a missed meeting.', response: 'I am sorry I missed our meeting this morning, that was my mistake. Could we reschedule? I will send a short summary of what I prepared beforehand.', evals: [{ r: 'tone', d: 3, q: 4 }] },
  { type: 'writing', prompt: 'Write a short thank-you note to a mentor.', response: 'Thank you for your guidance and patience this year. Your advice helped me grow in ways I will not forget.', evals: [{ r: 'tone', d: 1, q: 5 }] },
  { type: 'support', prompt: 'Politely refuse a feature request.', response: 'Thanks for the suggestion. We are not planning to build this right now, but we have noted it for future planning.', evals: [{ r: 'tone', d: 2, q: 3 }] },
  { type: 'support', prompt: 'Reply to a customer confused about their bill.', response: 'I understand billing can be confusing. Let me walk you through each line so it is clear, and I can fix any errors I find.' },
  { type: 'writing', prompt: 'Write a short condolence message to a colleague.', response: 'I am so sorry for your loss. Please take all the time you need, and know that we are all thinking of you.' },
];

const feedbackByQuality: Record<number, string> = {
  1: 'Does not answer the question.',
  2: 'Vague or partly incorrect.',
  3: 'Acceptable but shallow.',
  4: 'Good answer with minor gaps.',
  5: 'Excellent, precise answer.',
};
const OFFSETS = [0, 1, 0, -1];
const clamp = (n: number) => Math.max(1, Math.min(5, n));

// 10:00 UTC of the given day, so the evaluations of one day never straddle midnight
function at(daysAgo: number, minutes = 0) {
  const base = new Date();
  base.setUTCHours(10, 0, 0, 0);
  return new Date(Math.min(base.getTime() - daysAgo * 86400000 + minutes * 60000, Date.now() - 60000));
}

// Wipes and recreates the demo user's data (used by `npm run seed`)
export async function seedDemoUser() {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      ResponseModel.deleteMany({ userId: existing._id }),
      Rubric.deleteMany({ userId: existing._id }),
      Evaluation.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
  }
  const user = await User.create({ email: DEMO_EMAIL, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) });

  const rubrics = {} as Record<RubricKey, InstanceType<typeof Rubric>>;
  for (const key of Object.keys(rubricDefs) as RubricKey[]) {
    const def = rubricDefs[key];
    rubrics[key] = await Rubric.create({
      userId: user._id,
      name: def.name,
      description: def.description,
      criteria: def.criteria.map(([name, description]) => ({ name, description, minScore: 1, maxScore: 5 })),
    });
  }

  const docs = await ResponseModel.insertMany(
    data.map((r, i) => ({
      userId: user._id,
      prompt: r.prompt,
      response: r.response,
      type: r.type,
      sourceFile: 'seed',
      // uploaded the day before its first evaluation (unevaluated ones were uploaded recently)
      createdAt: r.evals ? at(Math.min(14, Math.max(...r.evals.map((e) => e.d)) + 1), -60) : at(1 + (i % 3), -60),
    })),
  );

  // Raw insert so the backdated createdAt values are kept (mongoose timestamps would overwrite them)
  const evaluations: any[] = [];
  data.forEach((r, ri) => {
    for (const ev of r.evals ?? []) {
      const rubric = rubrics[ev.r];
      const n = rubric.criteria.length;
      const when = at(ev.d, evaluations.length % 20);
      evaluations.push({
        userId: user._id,
        responseId: docs[ri]._id,
        rubricId: rubric._id,
        scores: rubric.criteria.map((c, ci) => {
          const adj = ev.q >= 2 && ev.q <= 4 ? OFFSETS[(evaluations.length + ci) % 4] : 0;
          const feedback =
            ci === 0 ? feedbackByQuality[ev.q]
            : ci === 2 && ev.q <= 2 ? 'Needs significant improvement here.'
            : ci === n - 1 && ev.q === 3 ? 'Would benefit from more detail.'
            : undefined;
          return { criterionId: c._id, criterionName: c.name, score: clamp(ev.q + adj), ...(feedback ? { feedback } : {}) };
        }),
        createdAt: when,
        updatedAt: when,
      });
    }
  });
  await Evaluation.collection.insertMany(evaluations);
  await Evaluation.syncIndexes();

  return { responses: docs.length, rubrics: Object.keys(rubrics).length, evaluations: evaluations.length };
}

// Called on server start: seeds only when the demo user does not exist yet,
// so restarting the API never overwrites data the user has changed.
export async function ensureDemoUser() {
  if (await User.exists({ email: DEMO_EMAIL })) return false;
  const r = await seedDemoUser();
  console.log(`Demo data created: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${r.responses} responses, ${r.rubrics} rubrics, ${r.evaluations} evaluations)`);
  return true;
}
