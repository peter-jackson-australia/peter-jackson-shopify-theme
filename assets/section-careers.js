const uploadCV = document.querySelector('#contact-form .button__uploadcv');
const fileInput = document.querySelector('#contact-form input[type="file"]');

if (uploadCV && fileInput) {
    uploadCV.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const fileName = fileInput.files[0]?.name;
        if (fileName) {
            uploadCV.textContent = fileName;
        }
    });
}

// Handle success modal
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status');

if (status === 'success') {
    const modal = document.querySelector('#success-modal');
    if (modal) {
        modal.classList.add('success-modal--show');
    }
}

function hideModal() {
    const modal = document.querySelector('#success-modal');
    if (modal) {
        modal.classList.remove('success-modal--show');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Close modal handlers
const closeButton = document.querySelector('#close-modal');
const modal = document.querySelector('#success-modal');

if (closeButton) {
    closeButton.addEventListener('click', hideModal);
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}