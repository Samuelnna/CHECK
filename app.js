const input = document.querySelector('#text-input');
const wordCount = document.querySelector('#word-count');
const report = document.querySelector('#report');

const sample = `Artificial intelligence is rapidly transforming modern society. Recent advances allow systems to generate text, images, and audio with increasing fluency. According to projections, the global AI market will continue to grow substantially over the next decade. However, responsible adoption requires transparency, human oversight, and robust safeguards. Organizations should evaluate both the benefits and limitations of these systems before implementation.`;

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

input.addEventListener('input', () => {
  const words = countWords(input.value);
  wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
});

document.querySelector('#sample-button').addEventListener('click', () => {
  input.value = sample;
  input.dispatchEvent(new Event('input'));
  input.focus();
});

document.querySelector('#clear-button').addEventListener('click', () => {
  input.value = '';
  input.dispatchEvent(new Event('input'));
  report.classList.add('hidden');
});

function sentenceSplit(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [];
}

function analyze(text) {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-z0-9'-]+/g) || [];
  const sentences = sentenceSplit(text);
  if (!words.length) return null;

  const repeated = normalized.match(/\b\w+\b/g) || [];
  const frequencies = {};
  repeated.forEach(word => { frequencies[word] = (freocities[word] || 0) + 1; });

  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'in conclusion', 'additionally', 'nevertheless'];
  const transitionCount = transitionWords.reduce((sum, term) => sum + (normalized.split(term).length - 1), 0);
  const hedgeWords = ['may', 'might', 'could', 'possibly', 'perhaps'];
  const hedgeCount = hedgeWords.reduce((sum, term) => sum + (normalized.match(new RegExp(`\\b${term}\\b`, 'g'))?.length || 0), 0);

  let aiScore = 12;
  const uniqueRatio = new Set(words).size / words.length;
  if (uniqueRatio < 0.45) aiScore += 24;
  if (avgSentenceLength >= 14 && avgSentenceLength <= 24) aiScore += 18;
  if (avgSentenceLength >= 24) aiScore += 12;
  if (transitionCount >= 2) aiScore += 14;
  if (hedgeCount >= 2) aiScore += 8;
  if (words.length >= 80) aiScore += 10;
  aiScore = Math.min(92, Math.max(8, aiScore));

  const phraseCounts = {};
  for (let i = 0; i < repeated.length - 3; i++) {
    const phrase = repeated.slice(i, i + 4).join(' ');
    if (phrase.length > 12) phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  }
  const repeatedPhrases = Object.values(phraseCounts).filter(count => count > 1).length;
  const similarityScore = Math.min(85, 5 + repeatedPhrases * 12 + (uniqueRatio < 0.38 ? 20 : 0));

  const claimPatterns = /\b(?:is|are|was|were|has|have|will|can|according|percent|\d|study|research|report|market|year)\b/i;
  const claims = sentences.filter(s => claimPatterns.test(s) && s.split(/\s+/).length >= 5).slice(0, 6);

  return { aiScore, similarityScore, claims, avgSentenceLength, uniqueRatio, transitionCount, hedgeCount, wordCount: words.length, repeatedPhrases };
}

function setMeter(id, value) {
  document.querySelector(id).style.width = `${value}%`;
}

document.querySelector('#check-button').addEventListener('click', () => {
  const result = analyze(input.value);
  if (!result) return;

  report.classList.remove('hidden');
  document.querySelector('#ai-score').textContent = result.aiScore;
  document.querySelector('#similarity-score').textContent = result.similarityScore;
  document.querySelector('#claim-count').textContent = result.claims.length;
  setMeter('#ai-meter', result.aiScore);
  setMeter('#similarity-meter', result.similarityScore);

  document.querySelector('#ai-label').textContent = result.aiScore >= 65 ? 'Strong indicators' : result.aiScore >= 40 ? 'Mixed indicators' : 'Few indicators';
  document.querySelector('#similarity-label').textContent = result.similarityScore >= 50 ? 'Closer review advised' : 'Low local repetition';
  document.querySelector('#claim-label').textContent = result.claims.length === 1 ? '1 assertion may need sources' : `${result.claims.length} assertions may need sources`;

  const signals = [];
  signals.push(result.uniqueRatio < 0.45 ? 'Reduced vocabulary diversity' : 'Healthy vocabulary diversity');
  signals.push(result.avgSentenceLength >= 14 && result.avgSentenceLength <= 24 ? 'Uniform sentence rhythm' : 'Varied sentence rhythm');
  signals.push(result.transitionCount >= 2 ? 'Frequent formal transitions' : 'Few formal transitions');
  signals.push(result.hedgeCount >= 2 ? 'Multiple cautious qualifiers' : 'Limited cautious qualifiers');
  document.querySelector('#signals-list').innerHTML = signals.map(s => `<li>${s}</li>`).join('');

  document.querySelector('#claims-list').innerHTML = result.claims.length
    ? result.claims.map(claim => `<div class="claim-item"><strong>Needs source verification</strong>${claim.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</div>`).join('')
    : '<p class="claim-item">No obvious factual assertion was detected.</p>';

  report.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
