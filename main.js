import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  let API_KEY = 'AIzaSyAUlM3kUC3bQL8L3bwgbzMml8_APTngihE';

  let form = document.getElementById('imageForm');
  let promptInput = document.querySelector('input[name="prompt"]');
  let output = document.querySelector('.output');
  let imageUpload = document.getElementById('imageUpload');
  let cameraInput = document.getElementById('cameraInput');
  const loader = document.getElementById('loader');
  const notfound = document.getElementById('notfound');

  const edit = document.querySelector('button[name="edit"]');
  const regenerate = document.querySelector('button[name="regenerate"]');
  const submit = document.querySelector('button[name="submit"]');
  const answer = document.querySelector('input[name="answer"]');
  const copy = document.querySelector('button[name="copy"]');
  
  edit.addEventListener('click', function() {
    if (answer.hasAttribute('readonly')) {
      answer.removeAttribute('readonly')
    } else {
      answer.setAttribute('readonly', 'readonly');
    }
  })
  
  copy.addEventListener('click', function() {
     // Select the text field
     var copyText = output.innerText;
   
      // Copy the text inside the text field
     navigator.clipboard.writeText(copyText);
   
     // Alert the copied text
     alert("Copied the text: " + copyText);
  })
  
  
  
  regenerate.addEventListener('click', function() {
    output.innerHTML = '';
    edit.setAttribute('hidden', 'hidden');
    regenerate.setAttribute('hidden', 'hidden');
    copy.setAttribute('hidden', 'hidden');
    submit.removeAttribute('hidden');
  
  })
  

  async function handleSubmit(file) {
    output.textContent = 'Generating...';
    notfound.setAttribute('hidden', 'hidden');


    try {
      const reader = new FileReader();

      reader.onloadend = async function () {
        let imageBase64 = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");

        let contents = [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              { text: promptInput.value }
            ]
          }
        ];

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-pro-vision",
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        });

        const result = await model.generateContentStream({ contents });

        let buffer = [];
        let md = new MarkdownIt();
        for await (let response of result.stream) {
          buffer.push(response.text());
          output.innerHTML = md.render(buffer.join(''));
        }

      };

      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);

      output.innerHTML += '<hr>' + e;

    }
  }

  form.onsubmit = (ev) => {
    ev.preventDefault();

    const imageFile = imageUpload.files[0] || cameraInput.files[0];
    if (imageFile) {

      handleSubmit(imageFile);
      loader.removeAttribute('hidden')
      edit.removeAttribute('hidden')
      regenerate.removeAttribute('hidden')
      copy.removeAttribute('hidden')
      submit.setAttribute('hidden', 'hidden')

    } else {
      notfound.removeAttribute('hidden');
    }
  };

  imageUpload.addEventListener('change', () => {
    if (imageUpload.files.length > 0) {
      cameraInput.value = '';
    }
  });

  cameraInput.addEventListener('change', () => {
    if (cameraInput.files.length > 0) {
      imageUpload.value = '';
    }
  });

  maybeShowApiKeyBanner(API_KEY);
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;
  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
  });
});

const typingText = document.getElementById('typing-text');
const text = "Hey, Ultron here!";
let index = 0;

function type() {
  typingText.textContent += text[index];
  index++;
  if (index === text.length) {
    index = 0;
    typingText.textContent = '';
  }
}

setInterval(type, 200); // Adjust typing speed (milliseconds) as needed
