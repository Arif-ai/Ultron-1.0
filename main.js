import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    let API_KEY = 'AIzaSyAUlM3kUC3bQL8L3bwgbzMml8_APTngihE';

    let form = document.querySelector('form');
    let promptInput = document.querySelector('input[name="prompt"]');
    let output = document.querySelector('.output');
    let imageUpload = document.getElementById('imageUpload');
    let cameraInput = document.getElementById('cameraInput');

    // Function to handle the submission logic
    async function handleSubmit(file) {
        output.textContent = 'Generating...';

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

    // Event listener for the form submission
    form.onsubmit = (ev) => {
        ev.preventDefault(); // Prevent form from submitting traditionally

        // Logic to decide which input is used
        const imageFile = imageUpload.files[0] || cameraInput.files[0];
        if (imageFile) {
            handleSubmit(imageFile);
        } else {
            output.textContent = 'No file selected!';
        }
    };

    // Clearing functionality for input fields
    imageUpload.addEventListener('change', () => {
        // Check if a file is selected in imageUpload and clear cameraInput
        if(imageUpload.files.length > 0) {
            cameraInput.value = '';
        }
    });

    cameraInput.addEventListener('change', () => {
        // Check if a file is selected in cameraInput and clear imageUpload
        if(cameraInput.files.length > 0) {
            imageUpload.value = '';
        }
    });

    maybeShowApiKeyBanner(API_KEY);
});