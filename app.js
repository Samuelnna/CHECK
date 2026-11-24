const input = document.querySelector('#text-input');
const wordCount = document.querySelector('#word-count');
const report = document.querySelector('#report');
const checkButton = document.querySelector('#check-button');
const imageInput = document.querySelector('#image-input');
const uploadArea = document.querySelector('#upload-area');
const checkImageButton = document.querySelector('#check-image-button');
let selectedImage = null;
let previewUrl = null;

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
  input.focus();
});

function sentenceSplit(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) || [];
}

function analyze(text) {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-z0-9'-]+/g) || [];
  const sentences = sentenceSplit(text);
  if (!words.length) return null;

  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'in conclusion', 'additionally', 'nevertheless'];
  const transitionCount = transitionWords.reduce((sum, term) => sum + (normalized.split(term).length - 1), 0);
  const hedgeWords = ['may', 'might', 'could', 'possibly', 'perhaps'];
  const hedgeCount = hedgeWords.reduce((sum, term) => sum + (normalized.match(new RegExp(`\\b${term}\\b`, 'g'))?.length || 0), 0);
  const uniqueRatio = new Set(words).size / words.length;

  let aiScore = 12;
  if (uniqueRatio < 0.45) aiScore += 24;
  if (avgSentenceLength >= 14 && avgSentenceLength <= 24) aiScore += 18;
  if (avgSentenceLength >= 24) aiScore += 12;
  if (transitionCount >= 2) aiScore += 14;
  if (hedgeCount >= 2) aiScore += 8;
  if (words.length >= 80) aiScore += 10;
  aiScore = Math.min(92, Math.max(8, aiScore));

  const tokens = normalized.match(/\b\w+\b/g) || [];
  const phraseCounts = {};
  for (let i = 0; i < tokens.length - 3; i++) {
    const phrase = tokens.slice(i, i + 4).join(' ');
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  }
  const repeatedPhrases = Object.values(phraseCounts).filter(count => count > 1).length;
  const similarityScore = Math.min(85, 5 + repeatedPhrases * 12 + (uniqueRatio < 0.38 ? 20 : 0));

  const claimPatterns = /\b(?:is|are|was|were|has|have|will|can|according|percent|\d|study|research|report|market|year)\b/i;
  const claims = sentences.filter(sentence => claimPatterns.test(sentence) && sentence.split(/\s+/).length >= 5).slice(0, 6);

  return { aiScore, similarityScore, claims, avgSentenceLength, uniqueRatio, transitionCount, hedgeCount };
}

function setMeter(selector, value) {
  const meter = document.querySelector(selector);
  if (meter) meter.style.width = `${value}%`;
}

function escapeHtml(text) {
  return text.replace(/[<>&"']/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

checkButton.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.setCustomValidity('Paste some text before checking it.');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');

  const result = analyze(text);
  if (!result) return;

  report.classList.remove('hidden');
  document.querySelector('#ai-score').textContent = result.aiScore;
  document.querySelector('#similarity-score').textContent = result.similarityScore;
  document.querySelector('#claim-count').textContent = result.claims.length;
  setMeter('#ai-meter', result.aiScore);
  setMeter('#similarity-meter', result.similarityScore);

  document.querySelector('#ai-label').textContent = result.aiScore >= 65 ? 'Strong indicators — not proof' : result.aiScore >= 40 ? 'Mixed indicators — not proof' : 'Few indicators — not proof';
  document.querySelector('#similarity-label').textContent = result.similarityScore >= 50 ? 'Repeated phrases found; review sources' : 'Low repetition within this text';
  document.querySelector('#claim-label').textContent = result.claims.length === 1 ? '1 assertion may need sources' : `${result.claims.length} assertions may need sources`;

  const signals = [
    result.uniqueRatio < 0.45 ? 'Reduced vocabulary diversity' : 'Healthy vocabulary diversity',
    result.avgSentenceLength >= 14 && result.avgSentenceLength <= 24 ? 'Uniform sentence rhythm' : 'Varied sentence rhythm',
    result.transitionCount >= 2 ? 'Frequent formal transitions' : 'Few formal transitions',
    result.hedgeCount >= 2 ? 'Multiple cautious qualifiers' : 'Limited cautious qualifiers'
  ];
  document.querySelector('#signals-list').innerHTML = signals.map(signal => `<li>${signal}</li>`).join('');
  document.querySelector('#claims-list').innerHTML = result.claims.length
    ? result.claims.map(claim => `<div class="claim-item"><strong>Needs source verification</strong>${escapeHtml(claim)}</div>`).join('')
    : '<p class="claim-item">No obvious factual assertion was detected.</p>';
  report.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function showImageError(message) {
  const error = document.querySelector('#image-error');
  error.textContent = message;
  error.classList.remove('hidden');
}

function loadImage(file) {
  const error = document.querySelector('#image-error');
  error.classList.add('hidden');
  document.querySelector('#image-result').classList.add('hidden');
  if (!file) return;
  if (!file.type.startsWith('image/') || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    showImageError('Please choose a PNG, JPG, WEBP, or GIF image.');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showImageError('This image is larger than 15 MB. Choose a smaller file.');
    return;
  }

  selectedImage = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  const preview = document.querySelector('#image-preview');
  preview.src = previewUrl;
  document.querySelector('#image-name').textContent = file.name;
  document.querySelector('#image-dimensions').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · reading dimensions…`;
  preview.onload = () => {
    document.querySelector('#image-dimensions').textContent = `${preview.naturalWidth} × ${preview.naturalHeight} pixels · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  };
  preview.onerror = () => showImageError('The selected file could not be previewed as an image.');
  document.querySelector('#image-preview-wrap').classList.remove('hidden');
  checkImageButton.disabled = false;
}

imageInput.addEventListener('change', () => loadImage(imageInput.files[0]));
['dragenter', 'dragover'].forEach(eventName => uploadArea.addEventListener(eventName, event => {
  event.preventDefault();
  uploadArea.classList.add('dragover');
}));
['dragleave', 'drop'].forEach(eventName => uploadArea.addEventListener(eventName, event => {
  event.preventDefault();
  uploadArea.classList.remove('dragover');
}));
uploadArea.addEventListener('drop', event => loadImage(event.dataTransfer.files[0]));

document.querySelector('#remove-image').addEventListener('click', () => {
  selectedImage = null;
  imageInput.value = '';
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  document.querySelector('#image-preview-wrap').classList.add('hidden');
  document.querySelector('#image-result').classList.add('hidden');
  checkImageButton.disabled = true;
});

const generatorPatterns = [
  ['OpenAI / DALL·E', /dall[- ]?e|openai/i],
  ['Midjourney', /midjourney/i],
  ['Stable Diffusion', /stable diffusion|stability\.ai|automatic1111|comfyui/i],
  ['Adobe Firefly', /adobe firefly|firefly/i],
  ['Google image tools', /imagen|google.*image|gemini.*image/i],
  ['Other AI generation metadata', /generative.?ai|ai.?generated|created by ai/i]
];

checkImageButton.addEventListener('click', async () => {
  if (!selectedImage) return;
  const resultSection = document.querySelector('#image-result');
  const summary = document.querySelector('#image-result-summary');
  const list = document.querySelector('#image-metadata-list');
  const title = document.querySelector('#image-result-title');
  checkImageButton.disabled = true;
  checkImageButton.querySelector('span').textContent = 'Checking metadata…';

  try {
    // Search embedded text chunks and metadata strings locally. This is provenance screening,
    // not pixel-based AI detection; metadata may be absent, stripped, or spoofed.
    const buffer = await selectedImage.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let embeddedText = '';
    const chunkSize = 64 * 1024;
    const decoder = new TextDecoder('latin1');
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      embeddedText += decoder.decode(bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)), { stream: offset + chunkSize < bytes.length });
    }
    embeddedText = embeddedText.toLowerCase();

    const foundGenerators = generatorPatterns.filter(([, pattern]) => pattern.test(embeddedText)).map(([name]) => name);
    const c2paFound = /c2pa|content credentials|contentauth/i.test(embeddedText);
    const metadataItems = [];
    if (foundGenerators.length) metadataItems.push(...foundGenerators.map(name => `AI-tool metadata keyword found: ${name}`));
    if (c2paFound) metadataItems.push('Content Credentials / C2PA-related marker found in the file.');
    if (!metadataItems.length) metadataItems.push('No recognized AI-generator or Content Credentials text marker was found in the scanned file bytes.');

    title.textContent = foundGenerators.length ? 'AI-related metadata clue found' : c2paFound ? 'Provenance marker found' : 'No recognized marker found';
    summary.textContent = foundGenerators.length
      ? 'This file contains text associated with an AI tool. Treat this as a provenance clue only; metadata can be edited and does not verify how the image was made.'
      : c2paFound
        ? 'A credentials-related marker is present, but this simple browser check cannot validate a signed provenance manifest.'
        : 'No matching generator tag was detected. This does not indicate whether the image was AI-generated; many images contain no readable provenance metadata.';
    list.innerHTML = metadataItems.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    showImageError('Could not read this image metadata in your browser. Try another image.');
  } finally {
    checkImageButton.disabled = !selectedImage;
    checkImageButton.querySelector('span').textContent = 'Check image metadata';
  }
});
