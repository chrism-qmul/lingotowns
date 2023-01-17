
let popupPage1 = document.querySelector('#popup-page1');
let popupPage2 = document.querySelector('#popup-page2');
let popupCloseButton1 = document.querySelector('#popup-close-button1');
let popupCloseButton2 = document.querySelector('#popup-close-button2');
let surveyYesButton = document.querySelector('#survey-yes-button');
let surveyNoButton = document.querySelector('#survey-no-button');


function displayPopup () {
    popupPage1.style.display = 'block';
}

function displaySurvey () {
    popupPage1.style.display = 'none';
    popupPage2.style.display = 'block';
}

function closePopup () {
    popupPage1.style.display = 'none';
    popupPage2.style.display = 'none';
}

popupCloseButton1.onclick = function () {
    closePopup()
};
popupCloseButton2.onclick = function () {
    closePopup()
};

surveyNoButton.onclick = function () {
    closePopup()
};

surveyYesButton.onclick = function () {
    displaySurvey()
};


//if displaySurvey is active prevent scroll of app.