import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'AIzaSyAEsugU_rBKBPORmMCu7Dr_5stVVMHhFtM';
  
    const form = document.getElementById('imageForm');
    const promptInput = document.querySelector('input[name="prompt"]');
    const output = document.querySelector('.output');
    const extraIngredientsDiv = document.getElementById('extraIngredientsDiv');
    const extraIngredientsInput = document.getElementById('extraIngredients');
    const imageUpload = document.getElementById('imageUpload');
    const cameraInput = document.getElementById('cameraInput');
    //afif
    const edit = document.querySelector('button[name="edit"]');
    const regenerate = document.querySelector('button[name="regenerate"]');
    const submit = document.querySelector('button[name="submit"]');
    const answer = document.querySelector('input[name="answer"]');
    const copy = document.querySelector('button[name="copy"]');
  
    async function callWithRetry(apiFunction, maxAttempts = 3) {
      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          return await apiFunction();
        } catch (error) {
          if (error.message.includes("Rpc timed out") && attempts < maxAttempts - 1) {
            //console.log(Attempt ${attempts + 1} failed; retrying...);
            attempts++;
          } else {
            throw error;
          }
        }
      }
    }

    edit.addEventListener('click', function() {
      if (answer.hasAttribute('readonly')) {
        answer.removeAttribute('readonly')
      } else {
        answer.setAttribute('readonly', 'readonly');
      }
    })
  
    regenerate.addEventListener('click', function() {
      answer.value = '(Results will appear here)';
      answer.setAttribute('readonly', 'readonly');
      edit.setAttribute('hidden', 'hidden');
      regenerate.setAttribute('hidden', 'hidden');
      copy.setAttribute('hidden', 'hidden');
      submit.removeAttribute('hidden');
    
    })

    copy.addEventListener('click', function() {
      // Select the text field
      answer.select();
      output.setSelectionRange(0, 99999); // For mobile devices
    
       // Copy the text inside the text field
      navigator.clipboard.writeText(output.textContent);
    
      // Alert the copied text
      alert("Copied the text: " + output.textContent);
   })
   
   

    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateRecipe);
  
    // Existing functions...
    async function updateRecipe() {
      const extraIngredients = extraIngredientsInput.value;
      if (!extraIngredients) {
        alert("Please enter additional ingredients.");
        return;
      }
      // Append extra ingredients to the prompt and re-submit to AI
      promptInput.value += `, ${extraIngredients}`;
      const file = imageUpload.files[0] || cameraInput.files[0];
      if (file) {
        handleSubmit(file, true);

      }
    }
  
    async function handleSubmit(file, skipInitial = false) {
      if (!skipInitial) {
        output.textContent = 'Generating...';
      }
      try {
        const reader = new FileReader();
  
        reader.onloadend = async () => {
          const imageBase64 = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
          const contents = [{
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              { text: promptInput.value }
            ]
          }];
  
          await callWithRetry(async () => {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({
              model: "gemini-pro-vision",
              safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }],
            });
  
            const result = await model.generateContentStream({ contents });
            let buffer = [];
            for await (const response of result.stream) {
              buffer.push(response.text());
              output.innerHTML = buffer.join('');
            }
            if (!skipInitial) {
              extraIngredientsDiv.style.display = 'block';  // Show the extra ingredients input
            }
          });
        };
         //UNHIDE BUTTONS
        edit.style.display = 'block';
        regenerate.style.display = 'block';
        copy.style.display = 'block';

        //HIDE BUTTONS
        submit.style.display = 'none';
        reader.readAsDataURL(file);
    
      
      } catch (e) {
        console.error("Error:", e);
        output.textContent = 'Error: ' + e.message;
      }


    }
  
    form.onsubmit = (ev) => {
        ev.preventDefault();  // Prevent the default form submission behavior
        const imageFile = imageUpload.files[0] || cameraInput.files[0];
        if (imageFile) {
          handleSubmit(imageFile);
        } else {
          output.textContent = 'No file selected!';
        }
      };
  
    imageUpload.addEventListener('change', () => {
      if (imageUpload.files.length > 0) {
        cameraInput.value = '';
        extraIngredientsDiv.style.display = 'none';  // Hide the extra ingredients input
      }
    });
  
    cameraInput.addEventListener('change', () => {
      if (cameraInput.files.length > 0) {
        imageUpload.value = '';
        extraIngredientsDiv.style.display = 'none';  // Hide the extra ingredients input
      }
    });
  });