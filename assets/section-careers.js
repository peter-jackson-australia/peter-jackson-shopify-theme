const uploadCVButton = document.querySelector('#contact-form .careers-submit-section__uploadcv-button');
const cvFileInput = document.querySelector('#contact-form input[type="file"]');
const successModal = document.querySelector('#success-modal');
const closeModalButton = document.querySelector('#close-modal');

const urlParams = new URLSearchParams(window.location.search);
const statusParam = urlParams.get('status');

if (statusParam === 'success') {
    successModal.classList.add('success-modal--show');
}

closeModalButton.addEventListener('click', () => {
    successModal.classList.remove('success-modal--show');
    window.history.replaceState({}, document.title, window.location.pathname);
});

uploadCVButton.addEventListener('click', () => cvFileInput.click());
cvFileInput.addEventListener('change', () => {
    const fileName = cvFileInput.files[0]?.name;
    if (fileName) {
        uploadCVButton.textContent = fileName;
    }
});